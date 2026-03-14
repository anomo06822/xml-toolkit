using System.Text;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

var customConfigPath = Environment.GetEnvironmentVariable("DATATOOLKIT_CONFIG_PATH");
if (!string.IsNullOrWhiteSpace(customConfigPath))
{
    builder.Configuration.AddJsonFile(customConfigPath, optional: true, reloadOnChange: true);
}

builder.Configuration.AddUserSecrets<Program>(optional: true);
builder.Services.Configure<GeminiOptions>(builder.Configuration.GetSection(GeminiOptions.SectionName));
builder.Services.AddHttpClient("gemini", client =>
{
    client.Timeout = TimeSpan.FromSeconds(45);
});

var app = builder.Build();

app.MapGet("/health", () =>
{
    return Results.Ok(new
    {
        ok = true,
        service = "DataToolkit.Api",
        time = DateTimeOffset.UtcNow
    });
});

app.MapPost("/api/ai/generate", async (
    GenerateRequest request,
    IHttpClientFactory httpClientFactory,
    IOptions<GeminiOptions> geminiOptions,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Model) || string.IsNullOrWhiteSpace(request.Contents))
    {
        return Results.BadRequest(new { error = "model and contents are required" });
    }

    var apiKey = geminiOptions.Value.ApiKey;
    if (string.IsNullOrWhiteSpace(apiKey))
    {
        return Results.Problem(
            detail: "Gemini API key is not configured on backend.",
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }

    var endpoint =
        $"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(request.Model)}:generateContent";

    var payload = new JsonObject
    {
        ["contents"] = new JsonArray
        {
            new JsonObject
            {
                ["parts"] = new JsonArray
                {
                    new JsonObject
                    {
                        ["text"] = request.Contents
                    }
                }
            }
        }
    };

    using var upstreamRequest = new HttpRequestMessage(HttpMethod.Post, endpoint)
    {
        Content = new StringContent(payload.ToJsonString(), Encoding.UTF8, "application/json")
    };
    upstreamRequest.Headers.Add("x-goog-api-key", apiKey);

    var client = httpClientFactory.CreateClient("gemini");
    using var upstreamResponse = await client.SendAsync(upstreamRequest, cancellationToken);
    var upstreamBody = await upstreamResponse.Content.ReadAsStringAsync(cancellationToken);

    if (!upstreamResponse.IsSuccessStatusCode)
    {
        return Results.Problem(
            detail: "Gemini upstream request failed.",
            statusCode: (int)upstreamResponse.StatusCode,
            extensions: new Dictionary<string, object?>
            {
                ["upstreamStatus"] = $"{(int)upstreamResponse.StatusCode} {upstreamResponse.ReasonPhrase}",
                ["upstreamBody"] = upstreamBody
            });
    }

    return Results.Ok(new
    {
        text = ExtractText(upstreamBody) ?? string.Empty
    });
});

app.Run();

static string? ExtractText(string json)
{
    try
    {
        var parsed = JsonNode.Parse(json);
        return parsed?["candidates"]?
            .AsArray()
            .FirstOrDefault()?["content"]?["parts"]?
            .AsArray()
            .FirstOrDefault()?["text"]?
            .GetValue<string>();
    }
    catch
    {
        return null;
    }
}

internal sealed record GenerateRequest(string Model, string Contents);
internal sealed class GeminiOptions
{
    public const string SectionName = "Gemini";

    public string? ApiKey { get; init; }
}
