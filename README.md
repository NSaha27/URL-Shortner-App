# URL SHORTNER APP

---

This is a URL Shortner app where a user can generate a short code and a QR code for an URL.

## How to use this app

- Enter the URL you want to shorten
- Enter the short code and click on the "Shorten" button
- You can see a QR code, a short-url relating to the original URL and the original URL itself, on the right side inside a block.

## Key points:

These are the important points relating to this app -

1. When a user submit the form, an http request with the form data will be sent to the server,
2. The server accepts the request along with the data i.e. the actual URL and the short-code. Then it makes another request to an external API to generate and fetch a QR code for the original URL,
3. After receiving the QR code image, it stores all the original URL, the Short-code and the QR code image to a .json file, here the "urls.json" file,
4. On the other hand, the application makes an API call to fetch data from the "urls.json" file, reads the content of the file and sends the data to the front-end to display the QR code, the Short-url and the original URL of each URL to the front-end side.
