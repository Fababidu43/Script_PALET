// ---------------------------------------------------------------- //
// IBM Confidential                                                 //
//                                                                  //
// OCO Source Materials                                             //
//                                                                  //
// Product(s):                                                      //
//     5733-XJ1                                                     //
//                                                                  //
// (C)Copyright IBM Corp.  2015, 2019                               //
//                                                                  //
// The Source code for this program is not published  or otherwise  //
// divested of its trade secrets,  irrespective of what has been    //
// deposited with the U.S. Copyright Office.                        //
// ---------------------------------------------------------------- //
//
// This script can be used for deploying and updating ACS on Windows
//


var args = WScript.Arguments;
var argsLength = args.length;

var thisVersion = "January 26, 2024"
var printhelp = "no";
var default_noparms = "no"
var reset_startover = "no";
var exclude_functions = "no";
var view_all_splf = "no";
var clear_mode = "no";
var quiet_mode = "no";
var remove_splash = " ";
var install_type_shared = "no";
var install_type_preset = "no";
var admin_config="no";
var admin_reset="no";
var admin_restore="no";
var skip_customize="no";
var continue_install="yes";
var acsconfig_file_update;
var emulation_assoc="no";
var source_AcsConfig = "";
var source_AcsConfig_save = "";
var desktop_shortcuts="no";
var acslaunch_exe;
var source;
var target1;
var target2;
var InstallPath;
var DesktopPath;
var fso;
var eula="";
var script_path;
var script_file;
var script_dir;
var java_rtncode=0;
var acs_rtncode=0;
var window_style=2;

fso = new ActiveXObject("Scripting.FileSystemObject");
Shell0 = new ActiveXObject("WScript.Shell");
// BasePath = Shell0.SpecialFolders("MyDocuments");
// BasePath = BasePath+"\\..\\";
HomePath = Shell0.ExpandEnvironmentStrings("%HOMEPATH%");
HomeDrive = Shell0.ExpandEnvironmentStrings("%HOMEDRIVE%");
ConHostPath = "C:\\Windows\\System32\\conhost.exe";

//HomePath = fso.GetAbsolutePathName(HomePath);
HomePath = (HomeDrive + HomePath);
//WScript.Echo("HomePath:"+HomePath);
//
// // Set local user install path
// InstallPath = fso.GetAbsolutePathName(BasePath);
// target2 = (InstallPath + "\\IBM\\ClientSolutions");
//
// if (!fso.FolderExists(target2)) {
//   // Since some users override MyDocuments, use %HOMEPATH% if no previous installation of ACS is found.
//   // We keep the above code so existing installations will continue to be used from where they already exist.
//   // WScript.Echo("Using HOMEPATH: "+HomePath);
//   InstallPath = HomePath;
// }
//
// DesktopPath = Shell0.SpecialFolders("Desktop");

// Set all users install path
ensure_elevated_privileges();
InstallPath = "C:\\Users\\Public";
DesktopPath = "C:\\Users\\Public\\Desktop";

target1 = (InstallPath + "\\IBM");
target2 = (InstallPath + "\\IBM\\ClientSolutions");

// Set log path
log_target = (HomePath + "\\IBM");

// Install 64bit ACS
win_exe = "\\Start_Programs\\Windows_x86-64\\acslaunch_win-64.exe";
// win_exe = "\\Start_Programs\\Windows_i386-32\\acslaunch_win-32.exe";


// Create short-cut for Product
function productShortcut(prod_path) {
  install_log.writeline("Creating shortcut for product.");
  Shell1 = new ActiveXObject("WScript.Shell");
  link1 = Shell1.CreateShortcut(DesktopPath + "\\Access Client Solutions.lnk");
  link1.Arguments = prod_path + win_exe;
  link1.Description = "IBM i Access Client Solutions";
  link1.HotKey = "CTRL+ALT+SHIFT+A";
  link1.IconLocation = prod_path + win_exe + ",0";
  link1.TargetPath = ConHostPath;
  link1.WindowStyle = 3;
  link1.WorkingDirectory = prod_path;
  link1.Save();
  install_log.writeline(link1.TargetPath + " " + link1.Arguments);
}

// Create short-cut for Session Mgr
function smShortcut(prod_path) {
  install_log.writeline("Creating shortcut for Session Mgr");
  Shell2 = new ActiveXObject("WScript.Shell");
  link2 = Shell2.CreateShortcut(DesktopPath + "\\ACS Session Mgr.lnk");
  link2.Arguments = prod_path + win_exe + " /plugin=sm";
  link2.Description = "IBM i Access Client Solutions - Session Manager";
  link2.HotKey = "CTRL+ALT+SHIFT+B";
  link2.IconLocation = prod_path + win_exe + ",5";
  link2.TargetPath = ConHostPath;
  link2.WindowStyle = 3;
  link2.WorkingDirectory = prod_path;
  link2.Save();
  install_log.writeline(link2.TargetPath + " " + link2.Arguments);
}

// Update product short-cut to invoke conhost
function updateProductShortcut(prod_path) {
  install_log.writeline("Check for conhost in product shortcut.");
  product_link = DesktopPath + "\\Access Client Solutions.lnk";
  if (fso.FileExists(product_link)) {
    install_log.writeline("Product shortcut found at: "+product_link);
    Shell1 = new ActiveXObject("WScript.Shell");
    link1 = Shell1.CreateShortcut(DesktopPath + "\\Access Client Solutions.lnk");
    t_path = link1.TargetPath;
    if (t_path.toLowerCase() == ConHostPath.toLowerCase()) {
       install_log.writeline("conhost found. No update needed.");
    }
    else {
       install_log.writeline("Adding conhost to shortcut.");
       currentArgs = link1.Arguments;
       install_log.writeline("Keeping arguments:"+currentArgs);
       // Preserve existing arguments in case they have been modified (eg -Xmx4g)
       link1.Arguments = prod_path + win_exe + " " + currentArgs;
       // link1.Description = "IBM i Access Client Solutions";
       // link1.HotKey = "CTRL+ALT+SHIFT+A";
       // link1.IconLocation = prod_path + win_exe + ",0";
       link1.TargetPath = ConHostPath;
       link1.WindowStyle = 3;
       link1.WorkingDirectory = prod_path;
       link1.Save();
       install_log.writeline(link1.TargetPath + " " + link1.Arguments);
    }
  }
  else {
    install_log.writeline("Product shortcut not found.");
  }
}

// Update sm short-cut to invoke conhost
function updateSmShortcut(prod_path) {
  install_log.writeline("Check for conhost in sm shortcut.");
  sm_link = DesktopPath + "\\ACS Session Mgr.lnk";
  if (fso.FileExists(sm_link)) {
    install_log.writeline("sm shortcut found at: "+sm_link);
    Shell2 = new ActiveXObject("WScript.Shell");
    link2 = Shell2.CreateShortcut(DesktopPath + "\\ACS Session Mgr.lnk");
    t_path = link2.TargetPath;
    if (t_path.toLowerCase() == ConHostPath.toLowerCase()) {
       install_log.writeline("conhost found. No update needed.");
    }
    else {
       install_log.writeline("Adding conhost to shortcut.");
       currentArgs = link2.Arguments;
       install_log.writeline("Keeping arguments:"+currentArgs);
       // Preserve existing arguments in case they have been modified (eg -Xmx4g)
       link2.Arguments = prod_path + win_exe + " " + currentArgs;
       // link2.Description = "IBM i Access Client Solutions - Session Manager";
       // link2.HotKey = "CTRL+ALT+SHIFT+B";
       // link2.IconLocation = prod_path + win_exe + ",5";
       link2.TargetPath = ConHostPath;
       link2.WindowStyle = 3;
       link2.WorkingDirectory = prod_path;
       link2.Save();
       install_log.writeline(link2.TargetPath + " " + link2.Arguments);
    }
  }
  else {
    install_log.writeline("sm shortcut not found.");
  }
}


// Create Desktop shortcuts
function createDesktopShortcuts() {

    Shell6 = new ActiveXObject("WScript.Shell");


    // Check to see if we are suppose to set Desktop shortcuts
    if (fso.FileExists(source_AcsConfig)) {

      retcode=Shell6.Run("findstr /B \"com.ibm.iaccess.desktopshortcuts=yes\"" + " "+ "\"" + source_AcsConfig + "\"",window_style,true);
      if (0 == retcode) {
        install_log.writeline("com.ibm.iaccess.desktopshortcuts=yes was found");
        desktop_shortcuts="yes";
      }
    }


    if ("yes" == desktop_shortcuts) {

      //Create shortcuts for product and SessionMgr
      productShortcut(target2);

      if ( ("no" != exclude_functions) & ((exclude_functions.indexOf("SM") > -1) |
                                      (exclude_functions.indexOf("sm") > -1) |
                                      (exclude_functions.indexOf("Emulator") > -1) |
                                      (exclude_functions.indexOf("emulator") > -1)) ) {
      // SM or emulator was excluded. Do not create shortcut
      }
      else {
        // SM was not excluded.
        smShortcut(target2);
      }
    }
    else {
        // Update existing Desktop shortcuts if needed
	updateProductShortcut(target2);
	updateSmShortcut(target2);
    }


}

// Check Java version on this PC
function checkJava() {

  // See if a compatible version of java exists
  sourceThis = fso.GetAbsolutePathName(script_dir);

  // When acslaunch_*.exe provides a return code, we can use the following command instead of the 6 lines which follow it.
  var java_cmd = "\""+acslaunch_exe + "\"" + " -norecurse -cp \"" + sourceThis + "\" -mc CheckVersion"
  install_log.writeline("Java command for compatibility check: "+java_cmd);

  src_checkversion = sourceThis + "\\CheckVersion.class";
  // Check to see if we can find the CheckVersion.class file.
  if (fso.FileExists(src_checkversion)) {
    // CheckVersion.class exists.  If we call it successfully, the minimum version of java we need exists.
    Shell8 = new ActiveXObject("WScript.Shell");
    java_rtncode = Shell8.Run(java_cmd ,window_style,true);
    // myMsgBox.Popup ("java_rtncode " + java_rtncode);

    if (0 == java_rtncode) {
      install_log.writeline("Compatible version of Java found.");
    }
    else {
      install_log.writeline("Compatible version of Java not found: " + java_rtncode);
    }
  }
  else {
    install_log.writeline("Compatible version of Java not checked because CheckVersion was not found.");
  }
}


// Create file associations
function createFileAssociations() {

  Shell4 = new ActiveXObject("WScript.Shell");
  // Do not specify -usejni since the default jli loads any required dependencies and jni does not.
  var command = "\""+acslaunch_exe + "\"" + remove_splash + eula + " /PLUGIN=fileassoc dttx dtfx hod bchx sql";

  // Check to see if we are suppose to set a file association for .ws files
  if (fso.FileExists(source_AcsConfig)) {

    retcode=Shell4.Run("findstr /B \"com.ibm.iaccess.pc5250assoc=yes\"" + " "+ "\"" + source_AcsConfig + "\"",window_style,true);
    if (0 == retcode) {
      install_log.writeline("com.ibm.iaccess.pc5250assoc=yes was found");
      emulation_assoc="yes";
    }
  }

  if ("yes" == emulation_assoc) {
    command = command + " ws";
  }

  install_log.writeline("Creating file associations");
  // WScript.Echo(command);
  // Clear any previous associations first otherwise the current ones won't be set.
  var clear_command = command + " /c";
  install_log.writeline(clear_command);
  retcode = Shell4.Run(clear_command,window_style,true);
  if (0 != retcode) {
    install_log.writeline("File associations NOT cleared successfully with retcode "+retcode);
    acs_rtncode = retcode;
  }
  // Set the associations
  install_log.writeline(command);
  retcode = Shell4.Run(command,window_style,true);
  if (0 == retcode) {
    install_log.writeline("File associations created.");
  }
  else {
    install_log.writeline("File associations NOT created with retcode "+retcode);
    acs_rtncode = retcode;
  }
}


// Print the help text
function print_help() {
  WScript.Echo("                  IBM i Access Client Solutions Installation\n\
\n\
Name:\n\
  install_acs_64.js -- install or upgrade the ACS product (64bit).\n\
\n\
Syntax:\n\
  install_acs_64.js [/Exclude=<function1,function2,...> | /Reset | /C | /Q | /R | /CQ | /CQR | /CR | /QR]\n\
  install_acs_64.js [/AdminConfig | /AdminRestore | /AdminReset]\n\
\n\
Description:\n\
Deploys, upgrades, and customizes IBM i Access Client Solutions (ACS).\n\
Product shortcuts will be placed on the desktop and file associations will also be created.\n\
\n\
This script can be used by:\n\
- users to deploy, upgrade, and customize a local installation\n\
- by administrators to customize and maintain available functions for multiple users\n\
\n\
If none of the optional parameters are specified:\n\
The product will be installed at <user_home_dir>\\IBM\\ClientSolutions\n\
For existing installations, the product files will be updated.\n\
For new installations, the user will be prompted to determine what functions\n\
they want available. This behavior may be overridden by an administrator using /AdminConfig\n\
\n\
Optional parameters:\n\
\n\
/Exclude=<function1,function2,...>\n\
- Install or refresh the product files and exclude the listed functions.\n\
See /PLUGIN=RESTRICT in GettingStarted for a list of valid functions.\n\
Note: This parameter will be ignored if the administrator has used /AdminConfig.\n\
\n\
/Reset\n\
- Reset the existing configuration and prompt the user for what functions they want available.\n\
Note: This parameter will be ignored if the administrator has used /AdminConfig.\n\
\n\
/C - Clear the Start_Programs folder and sub-folders before copying files.\n\
\n\
/Q - Do not display installation completion message when installing from an administrator configuration.\n\
\n\
/R - Do not display the splash screen when running this script.\n\
Note: With some distributions of Java 8, this option will cause parts of the install to fail.\n\
\n\
/CQ - Specifies C and Q options.\n\
\n\
/CQR - Specifies C, Q, and R options.\n\
\n\
/CR - Specifies C and R options.\n\
\n\
/QR - Specifies Q, and R options.\n\
\n\
/AdminConfig\n\
This parameter will assist an administrator in setting up or changing a configuration for multiple users.\n\
The administrator will be prompted to determine:\n\
- whether or not the product files and available functions will be shared by multiple users (eg Network share)\n\
- what functions will be made available to users (OR) whether or not the user will be allowed to choose for\n\
themselves what functions are available\n\
Using this parameter to indicate that product files are to be shared or that specific functions are to be excluded\n\
will take precedence over subsequent uses of /Exclude, /Reset, or the default (no parms) behavior of this script.\n\
Note:\n\
Installations that share the product files (eg Network share) do not have to rerun this script to pick up product\n\
updates or administrator changes.  Restarting the product will pick up the updates automatically.\n\
\n\
/AdminRestore\n\
Restore an internally saved version of the product configuration file.\n\
When an administrator updates the product files with a new version, unless specific steps were taken to save and restore\n\
the product configuration file, any customizations (including excluded functions) would have been lost.  This means\n\
previously excluded functions will no longer be excluded.  /AdminRestore will attempt to restore the product\n\
configuration file to what it was prior to the update.  If a saved version of the product configuration file\n\
cannot be found, /AdminConfig will need to be done to reconfigure the desired settings.\n\
\n\
/AdminReset\n\
Resets the product configuration file to the product defaults.\n\
All customizations done by /AdminConfig will be lost.\n\
Note: All excluded functions will become available to future installations and to existing shared installations.\n\
  ");

}


function ask_user_questions() {

  install_log.writeline("Asking about functions to be installed.");
  var emulation2_ans=7;  // By default assume the answer is "no"

  // Return values from Popup when 4th parm is 4 are:
  // 6 == yes
  // 7 == no
  var emulation1_ans = myMsgBox.Popup("Do you want to use 5250 emulation?                ",0,"IBM i Access Client Solutions",4);
  if (6 == emulation1_ans) {  
    emulation2_ans = myMsgBox.Popup("Do you want to make ACS the default program for your existing 5250 session profiles?\n\
\n\
Details:\n\
5250 session profiles created by IBM i Access for Windows or IBM Personal Communications \
can also be used by IBM i Access Client Solutions (ACS). These files have a file extension of .ws.  \
ACS will not update .ws files, but is able to use them to start a 5250 session.",0,"IBM i Access Client Solutions",4);
  }

  var print_ans =      myMsgBox.Popup("Do you want to view printer output?               ",0,"IBM i Access Client Solutions",4);
  if (6 == print_ans) {     // 6==yes  7==no
    var all_output = myMsgBox.Popup("Is it ok to view printer output for all users? ",0,"IBM i Access Client Solutions",4+256);

    if (6 == all_output) {  // 6==yes  7==n0
      view_all_splf = "yes"
    }
  }
  

  var ifs_ans =        myMsgBox.Popup("Do you want to use the Integrated File System?    ",0,"IBM i Access Client Solutions",4);
  var dt_ans =         myMsgBox.Popup("Do you want to transfer data to/from spreadsheets?",0,"IBM i Access Client Solutions",4);
  var inav_ans =       myMsgBox.Popup("Do you want to use Navigator for i?               ",0,"IBM i Access Client Solutions",4);
  var key_ans =        myMsgBox.Popup("Do you need to manage SSL/TLS certificates?       ",0,"IBM i Access Client Solutions",4);
  var db2tools_ans =   myMsgBox.Popup("Do you need to use Database tools?                ",0,"IBM i Access Client Solutions",4+256);
  var console_ans =    myMsgBox.Popup("Do you need to use an HMC or LAN console?         ",0,"IBM i Access Client Solutions",4+256);
  var rmtcmd_ans =     myMsgBox.Popup("Do you need to issue remote commands?             ",0,"IBM i Access Client Solutions",4+256);
  var debug_ans =      myMsgBox.Popup("Do you need to use the System Debugger?           ",0,"IBM i Access Client Solutions",4+256);
  var shortcut_ans =   myMsgBox.Popup("Do you want product shortcuts on the Desktop?     ",0,"IBM i Access Client Solutions",4);

          
  if (7 == emulation1_ans) { // 6==yes  7==no
    exclude_functions = exclude_functions + "emulator,";
  }
  if (6 == emulation2_ans) { // 6==yes  7==no
    emulation_assoc="yes";
  }
  if (7 == ifs_ans) {       // 6==yes  7==no
    exclude_functions = exclude_functions + "ifs,";
  }
  if (7 == print_ans) {     // 6==yes  7==no
    exclude_functions = exclude_functions + "splf,";
  }
  if (7 == dt_ans) {        // 6==yes  7==no
    exclude_functions = exclude_functions + "dataxfer,";
  }
  if (7 == inav_ans) {      // 6==yes  7==no
    exclude_functions = exclude_functions + "l1cplugin,"
  }
  if (7 == key_ans) {       // 6==yes  7==no
    exclude_functions = exclude_functions + "keyman,"
  }
  if (7 == db2tools_ans) {  // 6==yes  7==no
    exclude_functions = exclude_functions + "database,"
  }
  if (7 == console_ans) {   // 6==yes  7==no
    exclude_functions = exclude_functions + "opconsole,hwconsole,"
  }
  if (7 == rmtcmd_ans) {   // 6==yes  7==no
    exclude_functions = exclude_functions + "rmtcmd,"
  }
  if (7 == debug_ans) {    // 6==yes  7==no
    exclude_functions = exclude_functions + "debugger,"
  }
  if (6 == shortcut_ans) {  // 6==yes  7==no
    desktop_shortcuts = "yes";
  }


}


function copy_file(src_file, target_file) {

  Shell4 = new ActiveXObject("WScript.Shell");
  fso = new ActiveXObject("Scripting.FileSystemObject");
  // The * prevents the prompt which asks about Directory or File
  // WScript.Echo("xcopy.exe  \""+ src_file + "\" \"" + target_file + "*\" /K /Y /R");
  Shell4.Run("xcopy.exe  \""+ src_file + "\" \"" + target_file + "*\" /K /Y /R",window_style,true);
  install_log.writeline("Copy from/to: "+src_file+" / "+target_file);

}


// Copy AcsConfig.properties to AcsConfig_save.properties
function save_admin_config(src_config, dst_config) {

  fso = new ActiveXObject("Scripting.FileSystemObject");
  if (!fso.FileExists(src_config)) {
    install_log.writeline("A configuration cannot be saved because it does not exist.");
  }
  else {
    copy_file(src_config, dst_config);
    install_log.writeline("Saved configuration to: "+ dst_config);
  }
}


// Copy AcsConfig_save.properties to AcsConfig.properties
function restore_admin_config(src_config, dst_config) {

  fso = new ActiveXObject("Scripting.FileSystemObject");
  if (!fso.FileExists(src_config)) {
    install_log.writeline("A saved configuration cannot be restored because it does not exist: "+src_config);
    myMsgBox.Popup ("A saved configuration cannot be restored because it does not exist.");
  }
  else {
    copy_file(src_config, dst_config);
    install_log.writeline("Restored configuration from "+ src_config);
  }
}


// Kill daemon
function kill_daemon() {
  Shell9 = new ActiveXObject("WScript.Shell");
  // For certain cases, silently accept the EULA
  if ( ("yes" == quiet_mode) & (("yes" == install_type_shared) | ("yes" == install_type_preset)) ) {
     eula = " -Dcom.ibm.iaccess.AcceptEndUserLicenseAgreement=true ";
  }
  // Do not specify -usejni since the default jli loads any required dependencies and jni does not.
  var reset_command = "\""+src_acslaunch_exe + "\"" + remove_splash + eula + " /PLUGIN=maint /killdaemon";
  install_log.writeline(reset_command);
  retcode = Shell9.Run(reset_command,window_style,true);
  if (0 != retcode) {
    install_log.writeline("Reset for Maintenance failed with retcode "+retcode);
    acs_rtncode = retcode;
  }
}

// Extract AcsConfig.properties from acsbundle.jar
function reset_admin_config(src_folder, src_jar, src_zip) {
  oApp = new ActiveXObject("Shell.application");
  Shell5 = new ActiveXObject("WScript.Shell");
  fso = new ActiveXObject("Scripting.FileSystemObject");

  // This is suppose to be a temporary file.  Delete any old versions.
  if (fso.FileExists(src_zip)) {
    fso.DeleteFile(src_zip,true);
  }
  // Create a temporary zip so we can extract AcsConfig.properties from acsbundle.jar
  // The * prevents the prompt which asks about Directory or File
  // WScript.Echo("xcopy.exe \""+ src_jar + "\" \"" + src_zip + "*\"");
  Shell5.Run("xcopy.exe \""+ src_jar + "\" \"" + src_zip + "*\"",window_style,true);
  if (fso.FileExists(src_zip)) {
    var dst = oApp.NameSpace(fso.getFolder(src_folder).Path);
    var zip = oApp.NameSpace(fso.getFile(src_zip).Path);
    dst.CopyHere(zip.Items().Item("AcsConfig.default"),16);

    // Delete old AcsConfig.properties.
    if (fso.FileExists(src_AcsConfig_properties)) {
       fso.DeleteFile(src_AcsConfig_properties,true);
    }
    // Rename AcsConfig.default to AcsConfig.properties.
    var dst_file = fso.getFile(src_AcsConfig_default);
    dst_file.Name = "AcsConfig.properties";

    install_log.writeline("Reset AcsConfig.propertes from acsbundle.jar using AcsConfig.default.");
    fso.DeleteFile(src_zip,true);
  }
  else {
    install_log.writeline("Could not reset AcsConfig.propertes.");
  }
}

// Move the file to a file appended with _old
function moveFileTo_old(tgt_file) {
  Shell10 = new ActiveXObject("WScript.Shell");
  tgt_file_old = tgt_file + "_old";
  if (fso.FileExists(tgt_file)) {
    install_log.writeline("Moving " + tgt_file + " to " + tgt_file_old);
    Shell10.Run("cmd.exe /C move /Y \""+ tgt_file + "\"" + " " + "\"" + tgt_file_old + "\"",window_style,true);
  }
}

// Delete the _old file
function delete_oldFile(tgt_file) {
  Shell10 = new ActiveXObject("WScript.Shell");
  tgt_file_old = tgt_file + "_old";
  if (fso.FileExists(tgt_file_old)) {
    Shell10.Run("cmd.exe /C del /F \""+ tgt_file_old + "\"",window_style,true);
    if (fso.FileExists(tgt_file_old)) {
      install_log.writeline("Could not delete " + tgt_file_old);
    } 
    else {
      install_log.writeline("Deleted " + tgt_file_old);
    }
  }
}

// Copy product files
function copyProductFiles(include_acsconfig) {

  install_log.writeline("Copy product files from/to: "+source+" / "+target2);
  Shell7 = new ActiveXObject("WScript.Shell");

  // Need to kill the background LM process otherwise we won't be able to replace acsnative.dll and acspcoc.exe
  kill_daemon();

  //Shell3.Run("xcopy.exe \""+ source + "\" \"" + target2 + "\" /E /R /Y ",window_style,true);
  Shell7.Run("xcopy.exe \""+ source + "\\Documentation\" \"" + target2 + "\\\Documentation\\*\" /E /R /Y ",window_style,true);
  Shell7.Run("xcopy.exe \""+ source + "\\Fonts\" \"" + target2 + "\\Fonts\\*\" /E /R /Y ",window_style,true);
  Shell7.Run("xcopy.exe \""+ source + "\\Icons\" \"" + target2 + "\\Icons\\*\" /E /R /Y ",window_style,true);
  // Do not copy the install scripts since an Admin may not want their users calling them (eg /AdminConfig)
  // Shell7.Run("xcopy.exe \""+ source + "\\Linux_Application\" \"" + target2 + "\\Linux_Application\\*\" /E /R /Y ",window_style,true);
  // Shell7.Run("xcopy.exe \""+ source + "\\Mac_Application\" \"" + target2 + "\\Mac_Application\\*\" /E /R /Y ",window_style,true);
  // Shell7.Run("xcopy.exe \""+ source + "\\Windows_Application\" \"" + target2 + "\\Windows_Application\\*\" /E /R /Y ",window_style,true);
  // Copy both the 32bit & 64bit launcher (and optional jre) so fallback from 64 to 32bit works
  if ("yes" == clear_mode) {
     install_log.writeline("cmd.exe /C rmdir /S /Q \""+ target2 + "\\Start_Programs\" ");
     Shell7.Run("cmd.exe /C rmdir /S /Q \""+ target2 + "\\Start_Programs\" ",window_style,true);
  }

  acspcoc32_path =   target2 + "\\Start_Programs\\Windows_i386-32\\acspcoc.exe";
  acslaunch32_path = target2 + "\\Start_Programs\\Windows_i386-32\\acslaunch_win-32.exe";
  acsnative32_path = target2 + "\\Start_Programs\\Windows_i386-32\\acsnative.dll";
  acspcoc64_path =   target2 + "\\Start_Programs\\Windows_x86-64\\acspcoc.exe";
  acslaunch64_path = target2 + "\\Start_Programs\\Windows_x86-64\\acslaunch_win-64.exe";
  acsnative64_path = target2 + "\\Start_Programs\\Windows_x86-64\\acsnative.dll";
  
  // Move acslaunch, acsnative, and acspcoc to _old versions because they cannot be overlaid if they are active
  moveFileTo_old(acslaunch32_path);
  moveFileTo_old(acsnative32_path);
  moveFileTo_old(acspcoc32_path);
  moveFileTo_old(acslaunch64_path);
  moveFileTo_old(acsnative64_path);
  moveFileTo_old(acspcoc64_path);

  install_log.writeline("Copying Windows_x86-64... ");
  Shell7.Run("xcopy.exe \""+ source + "\\Start_Programs\\Windows_x86-64\" \"" + target2 + "\\Start_Programs\\Windows_x86-64\\*\" /E /R /Y /C",window_style,true);
  install_log.writeline("Copying Windows_i386-32... ");
  Shell7.Run("xcopy.exe \""+ source + "\\Start_Programs\\Windows_i386-32\" \"" + target2 + "\\Start_Programs\\Windows_i386-32\\*\" /E /R /Y /C",window_style,true);
  install_log.writeline("Copying acsbundle.jar ");
  Shell7.Run("xcopy.exe \""+ source + "\\acsbundle.jar\" \"" + target2 + "\\acsbundle.jar*\" /E /R /Y ",window_style,true);

  // Delete the _old versions of acslaunch, acsnative, and acspcoc in case they are not active.  If they are active, the delete will fail.
  delete_oldFile(acslaunch32_path);
  delete_oldFile(acsnative32_path);
  delete_oldFile(acspcoc32_path);
  delete_oldFile(acslaunch64_path);
  delete_oldFile(acsnative64_path);
  delete_oldFile(acspcoc64_path);

  // Check to see if there is an acs_bak.zip file.  If so, copy it too in case auto-import is enabled.
  acs_bak = source+"\\acs_bak.zip";
  if (fso.FileExists(acs_bak)) {
    Shell7.Run("xcopy.exe \""+ source + "\\acs_bak.zip\" \"" + target2 + "\\acs_bak.zip*\" /E /R /Y ",window_style,true);
  }

  if ("yes" == include_acsconfig) {
    Shell7.Run("xcopy.exe \""+ source + "\\AcsConfig.properties\" \"" + target2 + "\\AcsConfig.properties*\" /E /R /Y ",window_style,true);
    install_log.writeline("Copied AcsConfig.properties");
  }
  else {
    install_log.writeline("Existing AcsConfig.properties found");
  }
}

// Ask user what functions they want and copy the product files for local install
function customize_local_install() {
  // Ask the user what items they want installed.
  exclude_functions = "";

  ask_user_questions();
     
  // WScript.Echo("Returned exclude_functions: "+exclude_functions);
  copyProductFiles("yes");

  updatefile = new ActiveXObject("Scripting.FileSystemObject");
  acsconfig_file_update = updatefile.OpenTextFile(acsconfig_file,8,true);

  if ("" != exclude_functions) {
    acsconfig_file_update.writeline(" ");
    acsconfig_file_update.writeline("# --- "+sTime+" ---");
    acsconfig_file_update.writeline("com.ibm.iaccess.ExcludeComps="+exclude_functions);
    install_log.writeline("Install: Wrote AcsConfig.properties and excluded: " + exclude_functions);
    //WScript.Echo("Wrote AcsConfig.properties and excluded: " + exclude_functions);
  }
  else {
    install_log.writeline("Install: Wrote AcsConfig.properties with no functions excluded.");
    exclude_functions = "no";
  }

  if ("no" == view_all_splf) {
    acsconfig_file_update.writeline(" ");
    acsconfig_file_update.writeline("# --- "+sTime+" ---");
    acsconfig_file_update.writeline("com.ibm.iaccess.splf.FilterRestricted=true");
    install_log.writeline("Install: Wrote AcsConfig.properties com.ibm.iaccess.splf.FilterRestricted=true");
    // WScript.Echo("Wrote AcsConfig.properties com.ibm.iaccess.splf.FilterRestricted=true");
  }

}


function ensure_elevated_privileges() {
    if (!WScript.Arguments.Named.Exists("AllUsers")) {

        // Call the script again as an elevated administrator.  This will prompt if needed.
	var some_args="";
        if (argsLength >= 1) {
	  some_args=args(0);
          if (argsLength >= 2) {
            some_args=some_args+" "+args(1);
          }
	}
        new ActiveXObject("Shell.Application").ShellExecute(WScript.FullName, "\"" + WScript.ScriptFullName + "\""+" "+some_args+" /AllUsers", "", "runas", window_style);
        WScript.Quit();
    }
    else {
      // We added the AllUsers parm to prevent recursion. Subtract it here.
      argsLength=argsLength-1;
    }
}


// Timer
function waitSeconds(sec) {
  now = Date.parse(Date());
  limit = now + (sec * 1000);
  while (now < limit) {
    now = Date.parse(Date());
  }
}

// Begin: Main
// Do some parm checking and verification
if (argsLength > 1) {
  printhelp = "yes";
}
else
if (1 == argsLength) {
  if ( ("/Reset" != args(0)) & ("/reset" != args(0)) &
       ("/C" != args(0)) & ("/c" != args(0)) &
       ("/Q" != args(0)) & ("/q" != args(0)) &
       ("/R" != args(0)) & ("/r" != args(0)) &
       ("/CQ" != args(0)) & ("/cq" != args(0)) &
       ("/CQR" != args(0)) & ("/cqr" != args(0)) &
       ("/CR" != args(0)) & ("/cr" != args(0)) &
       ("/QR" != args(0)) & ("/qr" != args(0)) &
       ("/Exclude=" != args(0).substr(0,9)) & ("/exclude=" != args(0).substr(0,9)) &
       ("/AdminConfig" != args(0)) & ("/adminconfig" != args(0)) & 
       ("/AdminReset" != args(0)) & ("/adminreset" != args(0)) & 
       ("/AdminRestore" != args(0)) & ("/adminrestore" != args(0)) 
     ) {
     printhelp = "yes"
  }
}

if ("yes" == printhelp) {
  print_help();
}
else
if (0 == argsLength) {
  default_noparms = "yes";
}
else
if ( ("/Reset" == args(0)) | ("/reset" == args(0)) ) {
  reset_startover = "yes";
}
else
if ( ("/Exclude=" == args(0).substr(0,9)) | ("/exclude=" == args(0).substr(0,9)) ) {
  exclude_functions = args(0).substr(9);
  //WScript.Echo("Exclude functions: " + exclude_functions);
}
else
if ( ("/C" == args(0)) | ("/c" == args(0)) ) {
  clear_mode = "yes";
  // Treat this like no parameters were specified.  The user just wants to clear Start_Programs
  // for cases where it contains the JRE
  default_noparms = "yes";
}
else
if ( ("/Q" == args(0)) | ("/q" == args(0)) ) {
  quiet_mode = "yes";
  // Treat this like no parameters were specified.  The user just wants to ignore the completion message
  // so this can be called from a batch script w/o getting stalled.
  default_noparms = "yes";
}
else
if ( ("/R" == args(0)) | ("/r" == args(0)) ) {
  remove_splash = " -splash:nosplash ";
  // Treat this like no parameters were specified.  The user just wants to disable the splash screens.
  default_noparms = "yes";
}
else
if ( ("/CQ" == args(0)) | ("/cq" == args(0)) ) {
  clear_mode = "yes";
  quiet_mode = "yes";
  // Treat this like no parameters were specified for reasons stated above on /C and /Q.
  default_noparms = "yes";
}
else
if ( ("/CQR" == args(0)) | ("/cqr" == args(0)) ) {
  clear_mode = "yes";
  quiet_mode = "yes";
  remove_splash = " -splash:nosplash ";
  // Treat this like no parameters were specified for reasons stated above on /C and /Q.
  default_noparms = "yes";
}
else
if ( ("/CR" == args(0)) | ("/cr" == args(0)) ) {
  clear_mode = "yes";
  remove_splash = " -splash:nosplash ";
  // Treat this like no parameters were specified for reasons stated above on /C and /Q.
  default_noparms = "yes";
}
else
if ( ("/QR" == args(0)) | ("/qr" == args(0)) ) {
  quiet_mode = "yes";
  remove_splash = " -splash:nosplash ";
  // Treat this like no parameters were specified for reasons stated above on /C and /Q.
  default_noparms = "yes";
}
else
if ( ("/AdminConfig" == args(0)) | ("/adminconfig" == args(0)) ) {
  admin_config="yes"
}
else
if ( ("/AdminReset" == args(0)) | ("/adminreset" == args(0)) ) {
  admin_reset="yes"
}
else
if ( ("/AdminRestore" == args(0)) | ("/adminrestore" == args(0)) ) {
  admin_restore="yes"
}



// Continue: Main
if ("yes" == printhelp) {
  // Help text has already been printed
}
else { 
// Continue: Main
  Shell3 = new ActiveXObject("WScript.Shell");

  // Create the logging path
  try {
    // Create the IBM directory if it does not exist
    if (!fso.FolderExists(log_target)) {
      fso.CreateFolder(log_target);
    }
  }
  catch (exception) {
    // Either the environment variables are not set or the user is not authorized.
    log_target = target1;                                      // An allusers install will fallback to the install location.
    // log_target = Shell0.ExpandEnvironmentStrings("%TEMP%"); // A local user install will fall back to %TEMP%
  }

  // Create local install path
  // Create the IBM directory if it does not exist
  try {
    if (!fso.FolderExists(target1)) {
      fso.CreateFolder(target1);
    }
  }
  catch (exception) {
    // Ignore the exception in case the user is doing a shared install as specified by an AdminConfig
    // If it is not a shared install, we will fail later when trying to create target2.
  }

  // Get the directory of this script
  script_path = WScript.ScriptFullName;
  script_file = fso.GetFile(script_path);
  script_dir = fso.GetParentFolderName(script_file);

  // Source directory of unpacked product should be the parent of this script
  source = fso.GetAbsolutePathName(script_dir+"\\..\\");

  // Do some error checking to help determine common problems
  // For example, if user is running script from a partially unpacked zip file, the following files will not be visible.
  src_acslaunch_exe = source + win_exe;
  src_acsbundle_jar = source + "\\acsbundle.jar";
  src_acsbundle_zip = source + "\\acsbundle.zip";
  src_AcsConfig_properties = source + "\\AcsConfig.properties";
  src_AcsConfig_default = source + "\\AcsConfig.default";
  var myMsgBox=new ActiveXObject("WScript.shell")
  if (!fso.FileExists(src_acslaunch_exe)) {
    myMsgBox.Popup ("The following file is not visible.  Make sure you have extracted the contents of the zip archive: "+src_acslaunch_exe);
    throw new Error('Aborting script due to previously detected error');
  }
  if (!fso.FileExists(src_acsbundle_jar)) {
    myMsgBox.Popup ("The following file is not visible.  Make sure you have extracted the contents of the zip archive: "+src_acsbundle_jar);
    throw new Error('Aborting script due to previously detected error');
  }

  // Open install_acs_log.txt trace file
  outputfile = new ActiveXObject("Scripting.FileSystemObject");
  // install_log = outputfile.OpenTextFile(log_target+"\\install_acs_log.txt",2,true); // Open for write
  install_log = outputfile.OpenTextFile(log_target+"\\install_acs_log.txt",8,true); // Open for append
  var sTime = new Date();
  install_log.writeline("BEGIN--------------- "+sTime+" ---------------BEGIN");
  install_log.writeline("Version: "+thisVersion);
  install_log.writeline("InstallPath: "+InstallPath);

  // Trace command-line arguments
  if (0 == argsLength) {
    //WScript.Echo("No args specified");
    install_log.writeline("No args specified");
  }
  else {
    //WScript.Echo("Command-line args: "+args(0));
    install_log.writeline("Command-line args: "+args(0));
  }

  install_log.writeline("script_path:  "+script_path);

  // path of exclude_list
  // var exclude_file = script_dir + "\\exclude_list";
  // install_log.writeline("exclude_file: "+exclude_file);

  install_log.writeline("source: "+source);
  install_log.writeline("src_acslaunch_exe: "+src_acslaunch_exe);
  install_log.writeline("src_acsbundle_jar: "+src_acsbundle_jar);

  // AcsConfig_save.properties is used to restore a configuration after a product update 
  source_AcsConfig = fso.GetAbsolutePathName(source+"\\AcsConfig.properties");
  source_AcsConfig_save = fso.GetAbsolutePathName(source+"\\AcsConfig_save.properties");

  // Begin: AdminConfig, AdminReset, AdminRestore
  if ("yes" == admin_reset) {
    install_log.writeline("Admin reset");
    reset_admin_config(source, src_acsbundle_jar, src_acsbundle_zip);
    save_admin_config(source_AcsConfig, source_AcsConfig_save);
    continue_install="no";
  }
  else
  if ("yes" == admin_restore) {
    install_log.writeline("Admin restore");
    restore_admin_config(source_AcsConfig_save, source_AcsConfig);
    continue_install="no";
  }
  else
  // Is someone doing an AdminConfig?
  if ("yes" == admin_config) {
    // Begin: admin_config

    install_log.writeline("AdminConfig");

    // Begin: Admin Handle Saved Config
    if ( fso.FileExists(source_AcsConfig) & fso.FileExists(source_AcsConfig_save) ) { 
     install_log.writeline("A saved configuration exists.");

      // A saved configuration exists
      // Compare Config to saved_config to see if they are the same
      // var pccmd ="fc "+source_AcsConfig+" "+source_AcsConfig_save+" | findstr \"no differences\"";
      var pccmd ="fc "+ "\""+source_AcsConfig+"\""+ " "+"\""+source_AcsConfig_save+"\"";
      // WScript.Echo(pccmd);
      retcode=Shell3.Run(pccmd,window_style,true);
      if (0 != retcode) {
        // WScript.Echo("AdminConfig: A saved configuration is not the same as the current: "+retcode);
        install_log.writeline("AdminConfig: A saved configuration is not the same as the current.");

        // Files are not the same.  So admin may have just applied an update (or did a reset).

        // Return values from Popup when 4th parm is 4 are:
        // 6 == yes
        // 7 == no
        var answer = myMsgBox.Popup("Your configuration file has changed.  This normally happens during a product update.\n\
\n\
Do you want to restore the previous configuration? \n\
yes - The product files were updated and I would like to restore my\n\
         previous configuration\n\
no  - AcsConfig.properties has been manually edited and/or I would\n\
         like to keep the current version\n\
cancel - I do not know what to do",0,"IBM i Access Client Solutions",3);
        if (6 == answer) { // 6==yes  7==no
          restore_admin_config(source_AcsConfig_save, source_AcsConfig);
          install_log.writeline("AdminConfig: Restored the previously saved configuration.");

          skip_customize="yes";   // Skip the rest of the admin_config path
        }
        else
        if (7 == answer) {
          save_admin_config(source_AcsConfig, source_AcsConfig_save);
          install_log.writeline("AdminConfig: Did not restore the previously saved configuration.");
        }
        else {
          // User doesn't know what to do.
          install_log.writeline("AdminConfig: User cancelled");
      
          skip_customize="yes";   // Skip the rest of the admin_config path
        }      
      }
      else {
        // WScript.Echo("AdminConfig: A saved configuration is the same as the current configuration: "+retcode);
        install_log.writeline("AdminConfig: A saved configuration is the same as the current configuration.");
      }
    }
    // End: Admin Handle Saved Config


    // Begin: Admin Check for Customize config
    if ("yes" == skip_customize) {
      // skip next section
    }
    else {
      // Ask if they want to change their existing configuration.
      // Return values from Popup when 4th parm is 4 are:
      // 6 == yes
      // 7 == no
      answer = myMsgBox.Popup("Do you want to change the current configuration?",0,"IBM i Access Client Solutions",4);
      if (7 == answer) { // 6==yes  7==no
        install_log.writeline("AdminConfig: User did not want to update configuration.");
        skip_customize="yes";   // Skip the rest of the admin_config path
      }            
    }
    // End: Admin Check for Customize config


    // Begin: Admin Customize Config
    if ("yes" == skip_customize) {
      // skip next section
    }
    else { // Begin: Admin_customize

      install_log.writeline("AdminConfig: Customize");

      // Return values from Popup when 4th parm is 4 are:
      // 6 == yes
      // 7 == no
      var answer = myMsgBox.Popup("Is it ok to begin with the default configuration?\n\
\n\
yes - It is ok to begin with a default configuration\n\
no  - AcsConfig.properties has been manually edited and/or I would\n\
         like to update the current version\n\
",0,"IBM i Access Client Solutions",4);          
      if (6 == answer) { // 6==yes  7==no

        // Start with a fresh copy of AcsConfig.properties
        install_log.writeline("AdminConfig: User said it was ok to restore a default configuration");

        reset_admin_config(source, src_acsbundle_jar, src_acsbundle_zip);
        save_admin_config(source_AcsConfig, source_AcsConfig_save);
      }


      // Return values from Popup when 4th parm is 4 are:
      // 6 == yes
      // 7 == no
      var answer = myMsgBox.Popup("Do you want users to share the current location of the product files?\n\
\n\
yes - install requests (on Windows) will set shortcuts and file\n\
         associations to the current location of the product files\n\
no  - install requests will copy the product files to a local location on PC\n\
",0,"IBM i Access Client Solutions",4);          
      if (6 == answer) { // 6==yes  7==no
        install_type_shared="yes";

        // Make sure the AcsConfig.properties file exists and prepare to update it.
        if (fso.FileExists(source_AcsConfig)) {
          updatefile = new ActiveXObject("Scripting.FileSystemObject");
          acsconfig_file_update = updatefile.OpenTextFile(source_AcsConfig,8,true);
        }
        else {
          install_log.writeline("AdminConfig: File not found: " + source_AcsConfig);
          myMsgBox.Popup ("The following file is not visible.  Make sure you have extracted the contents of the zip archive: "+source_AcsConfig);
          throw new Error('Aborting script due to previously detected error');
        }

        acsconfig_file_update.writeline(" ");
        acsconfig_file_update.writeline("# --- "+sTime+" ---");
        acsconfig_file_update.writeline("com.ibm.iaccess.InstallType=shared");
        install_log.writeline("AdminConfig: Wrote com.ibm.iaccess.InstallType=shared to AcsConfig.properties file");

        // Enable DataCache by default so startup times for remote users will be faster after the 1st attempt.
        acsconfig_file_update.writeline("com.ibm.iaccess.DataCache=true");
        install_log.writeline("AdminConfig: Wrote com.ibm.iaccess.DataCache=true to AcsConfig.properties file");

        save_admin_config(source_AcsConfig, source_AcsConfig_save);


      }
      else {
        // Users will get their own copy of the product files so they will have their own AcsConfig.properties file too.
        // Since they have their own AcsConfig.properties file, they could also decide their own available function list too.
        // See if the admin will allow them to decide their own available functions

        // Return values from Popup when 4th parm is 4 are:
        // 6 == yes
        // 7 == no
        answer = myMsgBox.Popup("Do you want users to decide for themselves what functions are available?\n\
\n\
no  - I want to decide what functions are available to all my users\n\
yes - New installations will ask users what functions they want",0,"IBM i Access Client Solutions",4+256);          
        if (7 == answer) { // 6==yes  7==no
          install_type_preset="yes";

          // Make sure the AcsConfig.properties file exists and prepare to update it.
          if (fso.FileExists(source_AcsConfig)) {
            updatefile = new ActiveXObject("Scripting.FileSystemObject");
            acsconfig_file_update = updatefile.OpenTextFile(source_AcsConfig,8,true);
          }
          else {
            install_log.writeline("AdminConfig: File not found: " + source_AcsConfig);
            myMsgBox.Popup ("The following file is not visible.  Make sure you have extracted the contents of the zip archive: "+source_AcsConfig);
            throw new Error('Aborting script due to previously detected error');
          }

          acsconfig_file_update.writeline(" ");
          acsconfig_file_update.writeline("# --- "+sTime+" ---");
          acsconfig_file_update.writeline("com.ibm.iaccess.InstallType=preset");
          install_log.writeline("AdminConfig: Wrote com.ibm.iaccess.InstallType=preset to AcsConfig.properties file");

          save_admin_config(source_AcsConfig, source_AcsConfig_save);
  
        }
        else {
          // Admins said it was ok for each user to decide for themselves what functions they want. Don't ask customize questions.
          skip_customize="yes";
          install_log.writeline("AdminConfig: Admin said it was ok for each user to decide what functions they want.");
        }
      }

      


      if ("no"==skip_customize) {

        WScript.Echo("The next set of questions will determine what functions you make available to your users.");

        exclude_functions = "";
        ask_user_questions();     
 
        // Customize config file based on input from Admin
        if ("" != exclude_functions) {
          // updatefile = new ActiveXObject("Scripting.FileSystemObject");
          // acsconfig_file_update = updatefile.OpenTextFile(source_AcsConfig,8,true);
          acsconfig_file_update.writeline(" ");
          acsconfig_file_update.writeline("# --- "+sTime+" ---");
          acsconfig_file_update.writeline("com.ibm.iaccess.ExcludeComps="+exclude_functions);
          install_log.writeline("AdminConfig: Wrote AcsConfig.properties and excluded: " + exclude_functions);

          save_admin_config(source_AcsConfig, source_AcsConfig_save);
        }
        else {
          exclude_functions = "no";
          install_log.writeline("AdminConfig: No functions were excluded.");
        }

        if ("no" == view_all_splf) {
          acsconfig_file_update.writeline(" ");
          acsconfig_file_update.writeline("# --- "+sTime+" ---");
          acsconfig_file_update.writeline("com.ibm.iaccess.splf.FilterRestricted=true");
          install_log.writeline("Install: Wrote AcsConfig.properties com.ibm.iaccess.splf.FilterRestricted=true");
          // WScript.Echo("Wrote AcsConfig.properties com.ibm.iaccess.splf.FilterRestricted=true");
        }


        if ("yes" == emulation_assoc) {
          acsconfig_file_update.writeline(" ");
          acsconfig_file_update.writeline("# --- "+sTime+" ---");
          acsconfig_file_update.writeline("com.ibm.iaccess.pc5250assoc=yes");
          install_log.writeline("AdminConfig: Wrote AcsConfig.properties com.ibm.iaccess.pc5250assoc=yes");

          save_admin_config(source_AcsConfig, source_AcsConfig_save);
        }

        if ("yes" == desktop_shortcuts) {
          acsconfig_file_update.writeline(" ");
          acsconfig_file_update.writeline("# --- "+sTime+" ---");
          acsconfig_file_update.writeline("com.ibm.iaccess.desktopshortcuts=yes");
          install_log.writeline("AdminConfig: Wrote AcsConfig.properties com.ibm.iaccess.desktopshortcuts=yes");

          save_admin_config(source_AcsConfig, source_AcsConfig_save);
        }


      }

      WScript.Echo("You have finished setting up the configuration.");

    }
    // End: AdminConfig, AdminReset, AdminRestore


    // We could ask Admin if they want to install this configuration now.
    // answer = myMsgBox.Popup("Do you want to install the current configuration now?",0,"IBM i Access Client Solutions",4);          
    // if (7 == answer) { // 6==yes  7==no
    //   continue_install="no";
    //   install_log.writeline("AdminConfig: User did not want to install now.");
    // }
    continue_install="no";
   
  }
  // End: AdminConfig and AdminReset


  
  // Check to see if com.ibm.iaccess.InstallType=shared is present
  if ("no" == continue_install) {
    // The Admin only wanted to set up a configuration.  We are done.
  }
  else
  // Check to see if we are suppose to use a shared install for this user
  // var source_AcsConfig = fso.GetAbsolutePathName(source+"\\AcsConfig.properties");
  if (fso.FileExists(source_AcsConfig)) {

    // WScript.Echo("findstr /B \"com.ibm.iaccess.InstallType=shared\"" + " "+ "\"" + source_AcsConfig + "\"");
    retcode=Shell3.Run("findstr /B \"com.ibm.iaccess.InstallType=shared\"" + " "+ "\"" + source_AcsConfig + "\"",window_style,true);
    if (0 == retcode) {
      // WScript.Echo("com.ibm.iaccess.InstallType=shared was found");
      install_log.writeline("com.ibm.iaccess.InstallType=shared was found");
      install_type_shared = "yes";
    }
  }


  // Check to see if com.ibm.iaccess.InstallType=preset is present
  if ("no" == continue_install) {
    // The Admin only wanted to set up a configuration.  We are done.
  }
  else
  // Check to see if we are suppose to only use a configuration preset by the admin
  // var source_AcsConfig = fso.GetAbsolutePathName(source+"\\AcsConfig.properties");
  if (fso.FileExists(source_AcsConfig)) {

    // WScript.Echo("findstr /B \"com.ibm.iaccess.InstallType=preset\"" + " "+ "\"" + source_AcsConfig + "\"");
    retcode=Shell3.Run("findstr /B \"com.ibm.iaccess.InstallType=preset\"" + " "+ "\"" + source_AcsConfig + "\"",window_style,true);
    if (0 == retcode) {
      // WScript.Echo("com.ibm.iaccess.InstallType=preset was found");
      install_log.writeline("com.ibm.iaccess.InstallType=preset was found");
      install_type_preset = "yes";
    }
  }



  // Begin: No Parms, /Reset, /Exclude
  // Note: InstallType=shared or InstallType=preset (assumed to be set by an Admin) will override any other paramaters
  if ("no" == continue_install) {
    // The Admin only wanted to set up a configuration.  We are done.
  }
  else
  // When com.ibm.iaccess.InstallType=shared exists in source AcsConfig.properties, we do not allow user configurations (AND)...
  // We do not copy the product files
  if ("yes" == install_type_shared) {
    // Do not copy the files for the local user.  Set the shortcuts to the source location.
    target2 = source;
    install_log.writeline("Install: shared product and functions");

    if ("no" == default_noparms) {
      install_log.writeline(args(0)+" ignored because Admin set shared product functions");
      // WScript.Echo(args(0)+" ignored because Admin set shared product functions");
    } 
  }
  else
  // When com.ibm.iaccess.InstallType=preset exists in source AcsConfig.properties, we do not allow user configurations
  if ("yes" == install_type_preset) {
    install_log.writeline("Install: preset functions by AdminConfig");

    if ("no" == default_noparms) {
      install_log.writeline(args(0)+" ignored because Admin preset product functions");
      WScript.Echo(args(0)+" ignored because Admin preset product functions");
    } 

    // Create the ClientSolutions directory if it does not exist
    if (!fso.FolderExists(target2)) {
      fso.CreateFolder(target2);
      install_log.writeline("Install: Created "+target2);
    }

    copyProductFiles("yes");
    install_log.writeline("Install: Copied product files and configuration set by admin");
  }
  else {
    // Begin: User Install

    install_log.writeline("Install: Local user");

    // Create the ClientSolutions directory if it does not exist
    if (!fso.FolderExists(target2)) {
      try {
        fso.CreateFolder(target2);
      }
      catch (exception) {
        install_log.writeline("Exception: " + exception.description);
        install_log.writeline("ERROR: Could not find path: " + target2);
        WScript.Echo("ERROR: Could not find path: " + target2);
	fso.CreateFolder(target2); // Do the command again and let the script fail/exit. 
      }

      install_log.writeline("Install: Created "+target2);

    }

    var acsconfig_file = (target2 + "\\AcsConfig.properties");
    install_log.writeline("Target config: " + acsconfig_file);

    if ("yes" == default_noparms) {

      // Begin: Default No Parms
      if (fso.FileExists(acsconfig_file)) {
        // This is assumed to be the upgrade path.  AcsConfig.properties already exists, so do not overlay it.
        copyProductFiles("no");

        install_log.writeline("Install: Found existing AcsConfig.properties file");
        //WScript.Echo("Did not write AcsConfig.properties.");
      }
      else {
        // AcsConfig.properties does not exist.

        customize_local_install();

      }
    } // End: Default No Parms  
    else
    if ("no" != exclude_functions) {
      // Specific funcions are requested for exclusion.

      if (fso.FileExists(acsconfig_file)) {
        // AcsConfig.properties already exists, do not overlay it
        copyProductFiles("no");
      }
      else { 
        // It is ok to copy AcsConfig.properties too  
        copyProductFiles("yes");
      }
      
      // Append excluded functions to AcsConfig.properties
      updatefile = new ActiveXObject("Scripting.FileSystemObject");
      acsconfig_file_update = updatefile.OpenTextFile(acsconfig_file,8,true);
      acsconfig_file_update.writeline(" ");
      acsconfig_file_update.writeline("# --- "+sTime+" ---");
      acsconfig_file_update.writeline("com.ibm.iaccess.ExcludeComps="+exclude_functions);
      install_log.writeline("Exclude: Wrote AcsConfig.properties with excluded functions: "+exclude_functions);
      //WScript.Echo("Wrote AcsConfig.properties with excluded functions: "+exclude_functions);  
    }
    else {
      // ("yes" == reset_startover)
      // Reset the existing configuration and ask the user what they want
      customize_local_install();
 
      install_log.writeline("Reset: Wrote AcsConfig.properties from source: " + source);
    }

  } // End: Copy files
  // End: No Parms, /Reset, /Exclude


  if ("no" == continue_install) {
    // The Admin only wanted to set up a configuration.  We are done.
  }
  else {

    acslaunch_exe = target2 + win_exe;  // Location of Windows binary

    // For certain cases, silently accept the EULA
    if ( ("yes" == quiet_mode) & (("yes" == install_type_shared) | ("yes" == install_type_preset)) ) {
       eula = " -Dcom.ibm.iaccess.AcceptEndUserLicenseAgreement=true ";
    }

    // Check the version of java installed on this PC so we can tell user if we found one.
    try {
       checkJava();
    }
    catch(exception) {
       install_log.writeline("Exception: " + exception.description);
       install_log.writeline("Exception: Compatible version of Java not checked.");
    }

    // Create File Associations.  This could take awhile on a slow network since it is the 1st invocation.
    // Do this will also prompt for the license agreement for new installs
    try {
       createFileAssociations();
    }
    catch(exception) {
       install_log.writeline("Exception: " + exception.description);
       install_log.writeline("Exception: File associations NOT created.");
    }

    // Create Desktop shortcuts last so everything else is done before they show up.
    try {
       createDesktopShortcuts();
    }
    catch(exception) {
       install_log.writeline("Exception: " + exception.description);
       install_log.writeline("Exception: Desktop shortcuts not created.");
    }

    // Need to kill the background LM process so user can delete the install directory (if they want to)
    try {
       kill_daemon(); 
    }
    catch(exception) {
       install_log.writeline("Exception: " + exception.description);
       install_log.writeline("Exception: kill_daemon not run.");
    }

  }
  sTime = new Date();
  install_log.writeline("END----------------- "+sTime+" -----------------END");

  install_log.Close();
  if (("no" == quiet_mode) & ("yes" == continue_install)) {
    final_msg = "IBM i Access Client Solutions installation has finished."
    if (0 != acs_rtncode) {
      final_msg = final_msg + "\n\
\n\
Errors occurred during the installation.  See the install_acs_log.txt file.";
    }

    if (0 != java_rtncode) {
      final_msg = final_msg + "\n\
\n\
A 64-bit version of Java was not found during the install.\n\
If Access Client Solutions does not start, install the latest Java 8, 11, 17, or 21.";
    }
    WScript.Echo(final_msg);
  }


} // End: Main
