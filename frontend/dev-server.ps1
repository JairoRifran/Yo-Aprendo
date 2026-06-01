$root = "C:\Users\jairo.rifran\Desktop\yoaprendo\frontend"
$port = 4173

function Get-ContentType($path) {
  switch ([System.IO.Path]::GetExtension($path).ToLowerInvariant()) {
    ".html" { return "text/html; charset=utf-8" }
    ".js" { return "text/javascript; charset=utf-8" }
    ".css" { return "text/css; charset=utf-8" }
    ".png" { return "image/png" }
    ".jpg" { return "image/jpeg" }
    ".jpeg" { return "image/jpeg" }
    ".svg" { return "image/svg+xml" }
    ".json" { return "application/json; charset=utf-8" }
    default { return "application/octet-stream" }
  }
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $port)
$listener.Start()
Write-Host "YoAprendo frontend running at http://127.0.0.1:$port"

while ($true) {
  $client = $listener.AcceptTcpClient()

  try {
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader($stream)

    $requestLine = $reader.ReadLine()
    if (-not $requestLine) {
      $client.Close()
      continue
    }

    $parts = $requestLine.Split(" ")
    $requestPath = if ($parts.Length -ge 2) { $parts[1] } else { "/" }

    while ($reader.Peek() -ge 0) {
      $line = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($line)) { break }
    }

    if ($requestPath -eq "/") { $requestPath = "/index.html" }
    $safePath = $requestPath.Split("?")[0].TrimStart("/").Replace("/", "\")
    $filePath = Join-Path $root $safePath

    if ((Test-Path $filePath) -and (Get-Item $filePath).PSIsContainer) {
      $filePath = Join-Path $filePath "index.html"
    }

    if (-not (Test-Path $filePath)) {
      $body = [System.Text.Encoding]::UTF8.GetBytes("Not found")
      $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      $stream.Write($body, 0, $body.Length)
      $stream.Flush()
      $client.Close()
      continue
    }

    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $contentType = Get-ContentType $filePath
    $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Flush()
  }
  finally {
    $client.Close()
  }
}
