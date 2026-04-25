@echo off
echo Abriendo puertos para la aplicacion de Incidencias...
netsh advfirewall firewall add rule name="Incidencias Backend" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="Incidencias Frontend" dir=in action=allow protocol=TCP localport=5173
echo.
echo Listo! Los supervisores ya pueden acceder desde:
echo http://10.248.183.129:5173
pause
