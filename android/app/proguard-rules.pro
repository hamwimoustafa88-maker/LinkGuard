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

# None of @capacitor/{core,app,camera,network,splash-screen,status-bar}
# ship their own consumer ProGuard rules (verified: every plugin's
# consumer_proguard_dir build output is empty) - so without the rules
# below, R8 is free to rename/strip anything they reach by reflection.
# Root-caused crash: com.getcapacitor.PermissionState.byState() resolves a
# string via Enum.valueOf() - once R8 renames GRANTED/DENIED/PROMPT/etc,
# that throws IllegalArgumentException uncaught, right as a permission
# request (e.g. the QR scanner's camera prompt) resolves. Keeping every
# enum's values()/valueOf() is the standard defensive rule for exactly
# this failure mode; keeping the two packages below is broader than
# strictly necessary but appropriate here - all of the app's actual logic
# lives in the JS bundle, so there's nothing native-side worth obfuscating.
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.plugins.** { *; }
