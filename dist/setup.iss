; Script Inno Setup pour Script_PALET avec PyInstaller et Inno Setup
; ----------------------------------------------------------
; Vous pouvez adapter ce script selon vos besoins sp�cifiques.
; ----------------------------------------------------------

#define MyAppName "Script_PALET"
#define MyAppVersion "1.0"
#define MyAppPublisher "Votre Soci�t�"
#define MyAppURL "http://www.votresite.com"
#define MyAppExeName "gui_app.exe"

[Setup]
; Informations g�n�rales sur l'application
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
PrivilegesRequired=admin  ; N�cessite les droits administratifs pour installer les redistributables

; Ic�ne de l'installateur (optionnel)
; SetupIconFile=C:\Path\To\Your\Icon.ico

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Files]
; Inclusion de l'ex�cutable PyInstaller
Source: "C:\SQL_LOGICIEL\Script_PALET\dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

; Inclusion des fichiers additionnels (comme frozen_application_license.txt)
; Ajoutez ici d'autres fichiers n�cessaires
; Exemple :
; Source: "C:\SQL_LOGICIEL\Script_PALET\data\config.json"; DestDir: "{app}"; Flags: ignoreversion

; Inclusion du VC++ Redistributable
Source: "C:\SQL_LOGICIEL\Script_PALET\dependencies\vc_redist.x64.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

; Inclusion du IBM i Access ODBC Driver (si applicable)
; Source: "C:\SQL_LOGICIEL\Script_PALET\dependencies\IBM_i_Access_ODBC_Driver_Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
; Cr�ation des raccourcis
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Tasks]
; Option pour cr�er un raccourci sur le bureau
Name: "desktopicon"; Description: "Cr�er un raccourci sur le bureau"; GroupDescription: "Options suppl�mentaires:"; Flags: unchecked

[Run]
; Installation du VC++ Redistributable
Filename: "{tmp}\vc_redist.x64.exe"; Parameters: "/install /quiet /norestart"; StatusMsg: "Installation des d�pendances..."; Flags: waituntilterminated

; Installation du IBM i Access ODBC Driver (si applicable)
; Filename: "{tmp}\IBM_i_Access_ODBC_Driver_Setup.exe"; Parameters: "/quiet /norestart"; StatusMsg: "Installation du pilote ODBC..."; Flags: waituntilterminated

; Ex�cution de l'application apr�s l'installation (optionnel)
Filename: "{app}\{#MyAppExeName}"; Description: "Lancer {#MyAppName}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Suppression des raccourcis lors de la d�sinstallation
Type: files; Name: "{group}\{#MyAppName}\*"
Type: files; Name: "{commondesktop}\{#MyAppName}.lnk"
