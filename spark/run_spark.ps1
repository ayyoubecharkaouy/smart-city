$ErrorActionPreference = "Stop"

$KafkaPackage = "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1"
$ScriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path

function Assert-Command {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [string]$InstallHint
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Error "$Name est introuvable. $InstallHint"
        exit 1
    }
}

Assert-Command "java" "Installez Java 17 et configurez JAVA_HOME."
Assert-Command "spark-submit" "Executez 'py -m pip install -r requirements.txt' puis ajoutez le dossier Scripts de Python au PATH."

if (-not $env:KAFKA_BOOTSTRAP_SERVERS) {
    $env:KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"
}

Push-Location $ScriptDirectory
try {
    Write-Host "Lancement de PySpark Streaming..."
    Write-Host "Kafka : $env:KAFKA_BOOTSTRAP_SERVERS"

    & spark-submit --packages $KafkaPackage main.py
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
