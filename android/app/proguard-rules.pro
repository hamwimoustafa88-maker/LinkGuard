# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Capacitor's bridge (registerPlugin() in MainActivity.java, and its
# @CapacitorPlugin/@PluginMethod-annotated methods) is invoked by
# reflection, which minification can otherwise rename or strip.
-keep class dev.scouthub.linkguard.ShareTargetPlugin { *; }
-keepclassmembers class dev.scouthub.linkguard.ShareTargetPlugin {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
}
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
