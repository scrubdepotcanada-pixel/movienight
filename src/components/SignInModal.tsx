"use client";

interface SignInModalProps {
  onGoogle: () => void;
  onFacebook: () => void;
  onClose: () => void;
}

export default function SignInModal({ onGoogle, onFacebook, onClose }: SignInModalProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-700/50 rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 text-xl leading-none"
        >
          &times;
        </button>

        <div className="text-center mb-6">
          <span className="text-4xl">🎬</span>
          <h2 className="text-xl font-bold text-white mt-3 mb-1">Sign in to Next Movie</h2>
          <p className="text-gray-400 text-sm">Save your taste &amp; get better recommendations</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onGoogle}
            className="flex items-center justify-center gap-3 w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={onFacebook}
            className="flex items-center justify-center gap-3 w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-3 px-4 rounded-xl transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          By signing in you agree to our terms of service
        </p>
      </div>
    </div>
  );
}
