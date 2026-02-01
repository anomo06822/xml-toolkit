// Helper to parse XML string to DOM
export const parseXmlString = (xmlStr: string): Document => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, "text/xml");
  const parserError = doc.getElementsByTagName("parsererror");
  if (parserError.length > 0) {
    throw new Error(parserError[0].textContent || "Error parsing XML");
  }
  return doc;
};

// Helper to serialize DOM back to string
export const serializeXml = (node: Node): string => {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(node);
};

// Pretty print XML
export const formatXml = (xml: string, tab = '  '): string => {
  let formatted = '';
  let indent = '';
  xml.split(/>\s*</).forEach(node => {
      if (node.match( /^\/\w/ )) indent = indent.substring(tab.length);
      formatted += indent + '<' + node + '>\r\n';
      if (node.match( /^<?\w[^>]*[^\/]$/ )) indent += tab;
  });
  return formatted.substring(1, formatted.length - 3);
};

// Minify XML (Remove inter-tag whitespace)
export const minifyXml = (xmlStr: string): string => {
  // Pre-process: replace literal \n with newline so they are treated as whitespace
  // This handles cases where XML is pasted from logs with escaped characters
  const cleaned = xmlStr.replace(/\\n/g, '\n').replace(/\\r/g, '');

  try {
    const doc = parseXmlString(cleaned);
    
    // Recursive function to remove whitespace-only text nodes
    const removeWhitespace = (node: Node) => {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.TEXT_NODE) {
           // If text node contains only whitespace, remove it
           if (!child.nodeValue?.trim()) {
             node.removeChild(child);
           }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          removeWhitespace(child);
        }
      }
    };

    removeWhitespace(doc.documentElement);
    return serializeXml(doc);
  } catch (e) {
    // Fallback regex if DOM parsing fails (e.g. fragments)
    // Warning: This is less safe for mixed content but works for structural XML
    return cleaned.replace(/>\s+</g, '><').trim();
  }
};

// Recursive function to sort sibling nodes alphabetically by tag name
export const sortXmlNodes = (node: Node): void => {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const children = Array.from(element.children);
    
    // Sort children
    children.sort((a, b) => a.tagName.localeCompare(b.tagName));
    
    // Re-append in order
    children.forEach(child => element.appendChild(child));
    
    // Recurse
    children.forEach(child => sortXmlNodes(child));
  }
};

// Convert XML to JSON (Simplified structure)
export const xmlToJson = (node: Node): any => {
  if (node.nodeType === Node.TEXT_NODE) {
    const trimmed = node.nodeValue?.trim();
    if (trimmed) return trimmed;
    return null;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const obj: any = {};
    
    // Attributes
    if (element.attributes.length > 0) {
      obj["@attributes"] = {};
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        obj["@attributes"][attr.name] = attr.value;
      }
    }

    // Children
    if (element.hasChildNodes()) {
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        const childName = child.nodeName;
        
        // Skip empty text nodes
        if (child.nodeType === Node.TEXT_NODE && !child.nodeValue?.trim()) continue;

        const processedChild = xmlToJson(child);
        
        // Handle text content directly if it's the only child
        if (child.nodeType === Node.TEXT_NODE) {
            if (Object.keys(obj).length === 0) return processedChild; // Just text
            obj["#text"] = processedChild;
            continue;
        }

        if (obj[childName]) {
          if (!Array.isArray(obj[childName])) {
            obj[childName] = [obj[childName]];
          }
          obj[childName].push(processedChild);
        } else {
          obj[childName] = processedChild;
        }
      }
    }
    return obj;
  }
  return null;
};