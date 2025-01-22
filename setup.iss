[Setup]
AppName=Script_PALET
AppVersion=1.0.0
DefaultDirName={pf}\Script_PALET
DefaultGroupName=Script_PALET
OutputBaseFilename=Setup_Script_PALET_v1.0.0
Compression=lzma
SolidCompression=yes
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=lowest

[Files]
Source: "dist\gui_app.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dependencies\vc_redist.x64.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\Script_PALET"; Filename: "{app}\gui_app.exe"
Name: "{commondesktop}\Script_PALET"; Filename: "{app}\gui_app.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Créer un raccourci sur le bureau"; GroupDescription: "Options supplémentaires:"; Flags: unchecked

[Run]
Filename: "{tmp}\vc_redist.x64.exe"; Parameters: "/install /quiet /norestart"; StatusMsg: "Installation des dépendances..."; Flags: waituntilterminated
Filename: "{app}\gui_app.exe"; Description: "Lancer Script_PALET"; Flags: nowait postinstall skipifsilent
