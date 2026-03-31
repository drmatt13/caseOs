import { Request, Response } from "express";

export default async function proxyToContainer(
  req: Request,
  res: Response,
  containerUrl: string,
  basePath = "",
): Promise<void> {
  try {
    const [originalPathname, originalSearch = ""] = req.originalUrl.split("?");
    const normalizedBasePath = basePath.replace(/\/+$/, "");
    const strippedPath =
      normalizedBasePath &&
      originalPathname.startsWith(`${normalizedBasePath}/`)
        ? originalPathname.slice(normalizedBasePath.length)
        : normalizedBasePath === originalPathname
          ? "/"
          : req.path || "/";

    const url = new URL(containerUrl);
    const upstreamBasePath = url.pathname.replace(/\/+$/, "");
    const normalizedStrippedPath = strippedPath.startsWith("/")
      ? strippedPath
      : `/${strippedPath}`;

    url.pathname = `${upstreamBasePath}${normalizedStrippedPath}` || "/";
    url.search = originalSearch ? `?${originalSearch}` : "";

    const forwardHeaders: Record<string, string> = {};

    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (key.toLowerCase() === "host") continue;

      forwardHeaders[key] = Array.isArray(value) ? value.join(", ") : value;
    }

    const methodHasBody = !["GET", "HEAD"].includes(req.method.toUpperCase());

    const body =
      methodHasBody && req.body != null && Object.keys(req.body).length > 0
        ? JSON.stringify(req.body)
        : undefined;

    if (body && !forwardHeaders["content-type"]) {
      forwardHeaders["content-type"] = "application/json";
    }

    console.log("Proxy request:", {
      method: req.method,
      incomingPath: req.originalUrl,
      strippedPath,
      target: url.toString(),
    });

    const upstream = await fetch(url.toString(), {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    res.status(upstream.status);

    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === "transfer-encoding") return;
      res.setHeader(key, value);
    });

    const text = await upstream.text();
    res.send(text);
  } catch (error) {
    console.error("Proxy error:", error);

    res.status(502).json({
      error: "Bad gateway",
      message: error instanceof Error ? error.message : "Unknown proxy error",
    });
  }
}
