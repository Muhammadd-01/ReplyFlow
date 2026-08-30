const http = require('http');
http.get('http://127.0.0.1:3001/api/whatsapp/sessions', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => { console.log(JSON.parse(data)); });
}).on("error", (err) => { console.log("Error: " + err.message); });
