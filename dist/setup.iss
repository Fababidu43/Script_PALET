; Script Inno Setup pour Script_PALET avec PyInstaller et Inno Setup
; ----------------------------------------------------------
; Vous pouvez adapter ce script selon vos besoins spécifiques.
; ----------------------------------------------------------

#define MyAppName "Script_PALET"
#define MyAppVersion "1.0"
#define MyAppPublisher "Votre Société"
#define MyAppURL "http://www.votresite.com"
#define MyAppExeName "gui_app.exe"

[Setup]
; Informations générales sur l'application
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
PrivilegesRequired=admin  ; Nécessite les droits administratifs pour installer les redistributables

; Icône de l'installateur (optionnel)
; SetupIconFile=C:\Path\To\Your\Icon.ico

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Files]
; Inclusion de l'exécutable PyInstaller
Source: "C:\SQL_LOGICIEL\Script_PALET\dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

; Inclusion des fichiers additionnels (comme frozen_application_license.txt)
; Ajoutez ici d'autres fichiers nécessaires
; Exemple :
; Source: "C:\SQL_LOGICIEL\Script_PALET\data\config.json"; DestDir: "{app}"; Flags: ignoreversion

; Inclusion du VC++ Redistributable
Source: "C:\SQL_LOGICIEL\Script_PALET\dependencies\vc_redist.x64.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

; Inclusion du IBM i Access ODBC Driver (si applicable)
; Source: "C:\SQL_LOGICIEL\Script_PALET\dependencies\IBM_i_Access_ODBC_Driver_Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

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

; Installation du IBM i Access ODBC Driver (si applicable)
; Filename: "{tmp}\IBM_i_Access_ODBC_Driver_Setup.exe"; Parameters: "/quiet /norestart"; StatusMsg: "Installation du pilote ODBC..."; Flags: waituntilterminated

; Exécution de l'application après l'installation (optionnel)
Filename: "{app}\{#MyAppExeName}"; Description: "Lancer {#MyAppName}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Suppression des raccourcis lors de la désinstallation
Type: files; Name: "{group}\{#MyAppName}\*"
Type: files; Name: "{commondesktop}\{#MyAppName}.lnk"
