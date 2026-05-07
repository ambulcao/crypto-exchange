<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crypto Exchange API Docs (Scalar)</title>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            background: #0b0f19;
        }

        #app {
            height: 100%;
        }
    </style>
</head>
<body>
<div id="app"></div>

<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
<script>
    Scalar.createApiReference('#app', {
        url: @json($openApiUrl),
        theme: 'deepSpace',
        layout: 'modern',
        hideDownloadButton: false,
    });
</script>
</body>
</html>
