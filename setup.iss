; Script Inno Setup pour Script_PALET
#define MyAppName "Script_PALET"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Votre Société"
#define MyAppURL "http://www.votresite.com"
#define MyAppExeName "gui_app.exe"

[Setup]
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={pf}\{#MyAppName}
DefaultGroupName={#MyAppName}
OutputBaseFilename=Setup_{#MyAppName}_v{#MyAppVersion}
Compression=lzma
SolidCompression=yes
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=admin  ; Nécessaire pour installer le pilote ODBC

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Files]
; Inclure l'exécutable de l'application
Source: "dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

; Inclure le pilote ODBC
Source: "drivers\install_acs_64_allusers.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

; Inclure les dépendances (comme VC++ Redistributable)
Source: "dependencies\vc_redist.x64.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
; Création des raccourcis
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Tasks]
; Option pour créer un raccourci sur le bureau
Name: "desktopicon"; Description: "Créer un raccourci sur le bureau"; GroupDescription: "Options supplémentaires:"; Flags: unchecked

[Run]
; Installation du VC++ Redistributable
Filename: "{tmp}\vc_redist.x64.exe"; Parameters: "/install /quiet /norestart"; StatusMsg: "Installation des dépendances..."; Flags: waituntilterminated

; Installation du Pilote ODBC
Filename: "{tmp}\install_acs_64_allusers.exe"; Parameters: "/S"; StatusMsg: "Installation du pilote ODBC..."; Flags: waituntilterminated

; Exécution de l'application après l'installation (optionnel)
Filename: "{app}\{#MyAppExeName}"; Description: "Lancer {#MyAppName}"; Flags: nowait postinstall skipifsilent
