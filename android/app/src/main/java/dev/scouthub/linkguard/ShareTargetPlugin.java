package dev.scouthub.linkguard;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Bridges Android's share sheet (ACTION_SEND / ACTION_PROCESS_TEXT) into the
 * web app. app/page.tsx already knows how to run a scan for a URL delivered
 * via ?url= (see hooks/useScan.ts); ShareTargetListener.tsx feeds it the
 * same kind of URL, sourced from here instead - for both the cold-start
 * case (the share sheet is what launched the app) and the warm-start case
 * (the app was already running; delivered via singleTask + onNewIntent,
 * which BridgeActivity forwards to every plugin's handleOnNewIntent()
 * automatically - no MainActivity changes needed for that half).
 */
@CapacitorPlugin(name = "ShareTarget")
public class ShareTargetPlugin extends Plugin {

    // Share text is often a caption plus the link, e.g. "Check this out
    // https://example.com" - pull the first URL-shaped token out of it.
    private static final Pattern URL_PATTERN = Pattern.compile("https?://\\S+");

    private String pendingUrl;

    @Override
    public void load() {
        super.load();
        // Cold start: the activity's own launch intent already carries the
        // share, if that's how the app was opened.
        pendingUrl = extractUrl(getActivity().getIntent());
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        String url = extractUrl(intent);
        if (url != null) {
            JSObject data = new JSObject();
            data.put("url", url);
            notifyListeners("shareReceived", data);
        }
    }

    @PluginMethod
    public void getSharedUrl(PluginCall call) {
        JSObject result = new JSObject();
        // Consumed once, so returning to this screen later doesn't
        // re-trigger a scan of the same already-handled link.
        result.put("url", pendingUrl);
        pendingUrl = null;
        call.resolve(result);
    }

    private String extractUrl(Intent intent) {
        if (intent == null) {
            return null;
        }

        String text = null;
        String action = intent.getAction();
        if (Intent.ACTION_SEND.equals(action) && "text/plain".equals(intent.getType())) {
            text = intent.getStringExtra(Intent.EXTRA_TEXT);
        } else if (Intent.ACTION_PROCESS_TEXT.equals(action)) {
            CharSequence processText = intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT);
            text = processText != null ? processText.toString() : null;
        }

        if (text == null) {
            return null;
        }

        Matcher matcher = URL_PATTERN.matcher(text);
        return matcher.find() ? matcher.group() : null;
    }
}
