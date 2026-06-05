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

function Get-PythonCommand {
    if (Get-Command "py" -ErrorAction SilentlyContinue) {
        return @{
            Executable = "py"
            Arguments = @("-3")
            Display = "py -3"
        }
    }

    if (Get-Command "python" -ErrorAction SilentlyContinue) {
        return @{
            Executable = "python"
            Arguments = @()
            Display = "python"
        }
    }

    Write-Error "Python est introuvable. Installez Python 3.11 puis relancez le script."
    exit 1
}

function Get-SparkSubmit {
    $sparkSubmit = Get-Command "spark-submit" -ErrorAction SilentlyContinue
    if ($sparkSubmit) {
        return $sparkSubmit.Source
    }

    $pythonCommand = Get-PythonCommand
    $pythonExecutable = $pythonCommand.Executable
    $pythonArguments = $pythonCommand.Arguments

    $scriptsDirectory = & $pythonExecutable @pythonArguments -c "import sysconfig; print(sysconfig.get_path('scripts'))"
    if ($LASTEXITCODE -ne 0 -or -not $scriptsDirectory) {
        Write-Error "Impossible de localiser le dossier Scripts de Python."
        exit 1
    }

    $candidates = @(
        (Join-Path $scriptsDirectory "spark-submit.cmd"),
        (Join-Path $scriptsDirectory "spark-submit.exe"),
        (Join-Path $scriptsDirectory "spark-submit")
    )

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }

    $installCommand = "$($pythonCommand.Display) -m pip install -r requirements.txt"
    Write-Error "spark-submit est introuvable. Installez PySpark avec '$installCommand'. Dossier inspecte : $scriptsDirectory"
    exit 1
}

Assert-Command "java" "Installez Java 17 et configurez JAVA_HOME."
$SparkSubmit = Get-SparkSubmit

if (-not $env:KAFKA_BOOTSTRAP_SERVERS) {
    $env:KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"
}

Push-Location $ScriptDirectory
try {
    Write-Host "Lancement de PySpark Streaming..."
    Write-Host "Kafka : $env:KAFKA_BOOTSTRAP_SERVERS"
    Write-Host "Spark submit : $SparkSubmit"

    & $SparkSubmit --packages $KafkaPackage main.py
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
