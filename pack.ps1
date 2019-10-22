function ZipCurrentModule
{
    Param ([String]$moduleName)
    Robocopy.exe $defaultVersion\ $version\ /S
    Remove-Item "$moduleName.zip" -Force -Recurse
    ((Get-Content -Path module.config -Raw).TrimEnd() -Replace $defaultVersion, $version ) | Set-Content -Path module.config
    Start-Process -NoNewWindow -Wait -FilePath $zip -ArgumentList "a", "$moduleName.zip", "$version", "module.config"
    ((Get-Content -Path module.config -Raw).TrimEnd() -Replace $version, $defaultVersion ) | Set-Content -Path module.config
    Remove-Item $version -Force -Recurse
}

$defaultVersion="1.0.0"
$workingDirectory = Get-Location
$zip = "$workingDirectory\packages\7-Zip.CommandLine.18.1.0\tools\7za.exe"
$nuget = "$workingDirectory\build\tools\nuget.exe"
$nugetPath = "$workingDirectory\src\Alloy\Advanced.CMS.Compare.nuspec"
$moduleName = "advanced-cms-compare"
$assemblyVersionFile = "version.cs"

$versionMatch = (Select-String -Path $assemblyVersionFile -Pattern 'AssemblyVersion[^\d]*([\d+.]+)').Matches[0]
$version = $versionMatch.Groups[1].Value

if (!$version) {
    Write-Error "Failed to parse version information"
    exit 1
}

Write-Host "Creating nuget with $fileVersionMatch version and $version client assets version"

Set-Location src\Alloy\modules\_protected\$moduleName
ZipCurrentModule -moduleName $moduleName
Set-Location $workingDirectory
Start-Process -NoNewWindow -Wait -FilePath $nuget -ArgumentList "pack", $nugetPath, "-Version $version"
