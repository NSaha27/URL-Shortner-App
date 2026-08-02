import crypto from "crypto";
import { readFile, writeFile } from "fs/promises";
import http from "http";
import { URL } from "node:url";
import path from "path";

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  const reqURL = req.url;
  const method = req.method;

  if (reqURL === "/links" && method === "GET") {
    const formFileName = "urls.json";
    const formFilePath = path.resolve("public", "data", formFileName);
    try {
      const result = await readFile(formFilePath, "utf-8");
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(result);
    } catch (err) {
      console.error(err.message);
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain");
      return res.end("*internal server problem!");
    }
  } else if (reqURL === "/css/style.css" && method === "GET") {
    const cssFileName = "style.css";
    const cssFilePath = path.resolve("public", "css", cssFileName);
    try {
      const result = await readFile(cssFilePath, "utf-8");
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/css");
      return res.end(result);
    } catch (err) {
      console.error(err.message);
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain");
      return res.end("page not found!");
    }
  } else if ((reqURL === "/" || reqURL === "/index.html") && method === "GET") {
    const formFileName = "index.html";
    const formFilePath = path.resolve("public", formFileName);
    try {
      const content = await readFile(formFilePath, "utf-8");
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html");
      return res.end(content);
    } catch (err) {
      console.error(err.message);
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain");
      return res.end(`unable to load the page!`);
    }
  } else if (
    (reqURL === "/" || reqURL === "/index.html") &&
    method === "POST"
  ) {
    let body = [];
    req.on("data", (chunk) => {
      body.push(chunk);
    });
    req.on("end", async () => {
      const { actualURL, shortCode } = JSON.parse(
        Buffer.concat(body).toString(),
      );
      if (!actualURL) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "text/plain");
        return res.end("*invalid URL!");
      }
      const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

      const storageFileName = "urls.json";
      const storageFilePath = path.resolve("public", "data", storageFileName);
      try {
        const result = await readFile(storageFilePath, "utf-8");
        const urls = JSON.parse(result);
        if (Object.keys(urls).includes(finalShortCode)) {
          throw new Error("*a short code is already exists with this name!");
        }

        // set shortened URL
        const urlObj = new URL(actualURL);
        const shortenedURL = urlObj.origin + "/" + finalShortCode;

        // set QR Code
        const parameters = {
          data: actualURL,
          size: "100x100",
          format: "png",
          margin: 2,
          color: "#222",
          bgcolor: "#f2f2f2",
        };
        const qrAPIEndpoint = `http://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(parameters["data"])}&format=${parameters["format"]}&margin=${parameters["margin"]}&color=${parameters["color"]}&bgcolor=${parameters["bgcolor"]}`;
        const qrAPIResponse = await fetch(qrAPIEndpoint);
        const qrCodeImageURL = qrAPIResponse.url;

        if (qrCodeImageURL) {
          const updatedUrls = {
            ...urls,
            [finalShortCode]: { actualURL, shortenedURL, qrCodeImageURL },
          };
          await writeFile(
            storageFilePath,
            JSON.stringify(updatedUrls),
            "utf-8",
          );

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          return res.end(
            JSON.stringify({
              message: `*success! a new URL with the short code "${shortCode}" is added!`,
            }),
          );
        }
      } catch (err) {
        if (err.code === "ENOENT") {
          await writeFile(storageFilePath, JSON.stringify([]), "utf-8");
          console.log(
            `a new file with the name '${storageFileName}' has been created!`,
          );
          res.statusCode = 404;
          res.setHeader("Content-Type", "text/plain");
          return res.end("file not found!");
        } else {
          res.statusCode = 400;
          res.setHeader("Content-Type", "text/plain");
          return res.end(err.message);
        }
      }
    });
    req.on("error", (err) => {
      // handle error while receiving form data
      console.error(err.message);
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/plain");
      return res.end("Bad request!");
    });
  }
});

server.listen(PORT, (err) => {
  if (!err) {
    console.log(`server is running at http://localhost:${PORT}`);
  } else {
    console.error("unable to start the server, error:", err.message);
  }
});
