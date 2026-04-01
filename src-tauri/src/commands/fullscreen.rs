/// 풀스크린 감지
#[tauri::command]
#[allow(clippy::needless_return)]
pub async fn check_fullscreen() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        return Ok(check_fullscreen_macos());
    }

    #[cfg(target_os = "windows")]
    {
        return Ok(check_fullscreen_windows());
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Ok(false)
    }
}

#[cfg(target_os = "macos")]
#[allow(deprecated)]
fn check_fullscreen_macos() -> bool {
    // NSScreen 기반: 메뉴바가 숨겨져 있으면 풀스크린
    use cocoa::appkit::NSScreen;
    use cocoa::base::nil;
    use cocoa::foundation::NSRect;
    unsafe {
        let screen = NSScreen::mainScreen(nil);
        if screen.is_null() {
            return false;
        }
        let frame: NSRect = NSScreen::frame(screen);
        let visible: NSRect = NSScreen::visibleFrame(screen);
        // 풀스크린 시 메뉴바/독이 사라짐 → 높이 차이가 거의 없음
        let menubar_height = frame.size.height - visible.size.height - visible.origin.y;
        menubar_height < 1.0
    }
}

#[cfg(target_os = "windows")]
fn check_fullscreen_windows() -> bool {
    use std::process::Stdio;
    let output = std::process::Command::new("powershell")
        .args(["-NoProfile", "-Command",
            "Add-Type -AssemblyName System.Windows.Forms; \
             $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; \
             Add-Type @' \n\
             using System; using System.Runtime.InteropServices; \n\
             public class Win32 { \n\
               [DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow(); \n\
               [DllImport(\"user32.dll\")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect); \n\
               [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L,T,R,B; } \n\
             } \n\
             '@ -ErrorAction SilentlyContinue; \
             $hwnd = [Win32]::GetForegroundWindow(); \
             $rect = New-Object Win32+RECT; \
             [Win32]::GetWindowRect($hwnd, [ref]$rect) | Out-Null; \
             $w = $rect.R - $rect.L; $h = $rect.B - $rect.T; \
             if ($w -ge $screen.Width -and $h -ge $screen.Height) { 'true' } else { 'false' }"
        ])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output();

    match output {
        Ok(o) => String::from_utf8_lossy(&o.stdout).trim() == "true",
        Err(_) => false,
    }
}
