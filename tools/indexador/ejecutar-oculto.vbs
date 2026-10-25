' Lanza ejecutar.bat sin mostrar ventana de consola (segundo plano).
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = dir
sh.Run """" & dir & "\ejecutar.bat""", 0, True
