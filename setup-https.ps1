$xamppRoot = "C:\xampp"
$httpdConf = Join-Path $xamppRoot "apache\conf\httpd.conf"
$sslConf = Join-Path $xamppRoot "apache\conf\extra\httpd-ssl.conf"

function Ensure-Uncommented($filePath, $pattern) {
    $content = Get-Content $filePath
    $updated = $content -replace "^\s*#\s*($pattern)", '$1'
    if ($content -ne $updated) {
        $updated | Set-Content $filePath -Encoding UTF8
        Write-Host "✔ Updated $filePath -> Uncommented $pattern"
    } else {
        Write-Host "↺ $filePath already has $pattern enabled"
    }
}

Write-Host "Configuring HTTPD..."
Ensure-Uncommented $httpdConf "LoadModule ssl_module modules/mod_ssl.so"
Ensure-Uncommented $httpdConf "LoadModule socache_shmcb_module modules/mod_socache_shmcb.so"
Ensure-Uncommented $httpdConf "Include conf/extra/httpd-ssl.conf"

# Update SSL virtual host settings
if (-Not (Test-Path $sslConf)) {
    throw "SSL config not found at $sslConf"
}

$sslContent = Get-Content $sslConf
$sslContent = $sslContent -replace 'DocumentRoot\s+"[^"]+"', 'DocumentRoot "C:/xampp/htdocs/simplepos.react"'
$sslContent = $sslContent -replace 'ServerName\s+[^\s]+', 'ServerName 192.168.0.66:443'
$sslContent = $sslContent -replace 'SSLCertificateFile\s+"[^"]+"', 'SSLCertificateFile "conf/ssl.crt/server.crt"'
$sslContent = $sslContent -replace 'SSLCertificateKeyFile\s+"[^"]+"', 'SSLCertificateKeyFile "conf/ssl.key/server.key"'
Set-Content $sslConf $sslContent -Encoding UTF8
Write-Host "✔ SSL virtual host now points at simplepos.react root"

Write-Host "✅ Run the XAMPP Control Panel as Administrator, restart Apache, and open https://192.168.0.66/simplepos.react on your phone to approve the self-signed cert."
