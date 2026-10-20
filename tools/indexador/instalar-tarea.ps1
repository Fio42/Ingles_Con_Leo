$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nombre = 'InglesConLeo-Indexador'
$accion = New-ScheduledTaskAction -Execute (Join-Path $dir 'ejecutar.bat') -WorkingDirectory $dir
$cada6h = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Hours 6) -RepetitionDuration (New-TimeSpan -Days 3650)
$alIniciarSesion = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$ajustes = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 2) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $nombre -Action $accion -Trigger @($cada6h, $alIniciarSesion) -Settings $ajustes -Principal $principal -Description 'Pide indexacion en Google Search Console de las URLs de inglesconleo.com que no estan indexadas (cada 6 h).' -Force | Out-Null
Write-Host "Tarea '$nombre' creada: se ejecuta cada 6 horas (y al iniciar sesion) mientras tu usuario tenga la sesion de Windows abierta."
Write-Host 'Primera ejecucion en unos 2 minutos.'
