' bridge-watchdog.vbs - windowless watchdog for the proxy bridge (port 54123).
'
' WHY VBS INSTEAD OF POWERSHELL:
'   When Task Scheduler launches powershell.exe directly, the console host
'   (conhost) is created before -WindowStyle Hidden takes effect, so a black
'   console window FLASHES on screen every run. wscript.exe is a GUI-subsystem
'   host and NEVER creates a console, so this watchdog is completely silent.
'
' SETUP (every N minutes):
'   $action  = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument '"<absolute path of this file>"'
'   $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 2)
'   Register-ScheduledTask -TaskName 'dsh-bridge-watchdog' -Action $action -Trigger $trigger -Force
'
' Optional env vars (set before the task runs, or in the machine/user env):
'   PROXY_BRIDGE_PORT      default 54123
'   NODE_EXE               node binary, default "node"
'   PROXY_BRIDGE_MEDIA_DIR passed to the bridge child process

Option Explicit

Dim fso, scriptDir, port, http, status, sh, env, nodeExe, bridgeJs, mediaDir

Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

Set sh = CreateObject("WScript.Shell")
Set env = sh.Environment("PROCESS")

port = 54123
If env("PROXY_BRIDGE_PORT") <> "" Then port = CInt(env("PROXY_BRIDGE_PORT"))

' --- probe the bridge health endpoint -------------------------------------
status = -1
Set http = CreateObject("MSXML2.ServerXMLHTTP")
On Error Resume Next
http.setProxy 2, ""          ' direct connection, do not use system proxy
http.open "GET", "http://127.0.0.1:" & port & "/health", False
http.setTimeouts 2000, 2000, 2000, 4000
http.send
If Err.Number = 0 Then
  status = http.status
End If
Err.Clear
On Error GoTo 0
Set http = Nothing

' --- relaunch hidden if the bridge is not healthy --------------------------
If status <> 200 Then
  nodeExe = "node"
  If env("NODE_EXE") <> "" Then nodeExe = env("NODE_EXE")
  bridgeJs = """" & scriptDir & "\proxy-bridge.cjs"""
  If env("PROXY_BRIDGE_MEDIA_DIR") <> "" Then
    env("PROXY_BRIDGE_MEDIA_DIR") = env("PROXY_BRIDGE_MEDIA_DIR")
  End If
  ' second arg 0 = SW_HIDE, third arg False = do not wait
  sh.Run """" & nodeExe & """ " & bridgeJs, 0, False
End If

Set env = Nothing
Set sh = Nothing
Set fso = Nothing
