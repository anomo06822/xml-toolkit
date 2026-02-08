using System.Text;
using System.Text.Json.Nodes;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient("gemini", client =>
{
    client.Timeout = TimeSpan.FromSeconds(45);
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("desktop", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors("desktop");

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
    IConfiguration configuration,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Model) || string.IsNullOrWhiteSpace(request.Contents))
    {
        return Results.BadRequest(new { error = "model and contents are required" });
    }

    var apiKey = configuration["GEMINI_API_KEY"];
    if (string.IsNullOrWhiteSpace(apiKey))
    {
        return Results.Problem(
            detail: "GEMINI_API_KEY is not configured on backend.",
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }

    var endpoint =
        $"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(request.Model)}:generateContent?key={Uri.EscapeDataString(apiKey)}";

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
