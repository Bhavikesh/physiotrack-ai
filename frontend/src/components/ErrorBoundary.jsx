/**
 * Error Boundary Component
 * Catches and handles React errors gracefully
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Log to error tracking service (e.g., Sentry) if configured
    if (window.errorTracker) {
      window.errorTracker.captureException(error, { extra: errorInfo });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gray-800 rounded-lg border border-red-500/30 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-900 to-orange-900 p-6 rounded-t-lg">
              <div className="flex items-center gap-4">
                <div className="bg-red-500/20 p-3 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Oops! Something went wrong
                  </h1>
                  <p className="text-red-200 mt-1">
                    We encountered an unexpected error
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error Message */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <span className="text-red-400">⚠️</span>
                  Error Details
                </h3>
                <p className="text-red-300 text-sm font-mono">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>

              {/* What happened */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-blue-200 font-medium mb-2">What happened?</h3>
                <p className="text-gray-300 text-sm">
                  The application encountered an unexpected error and couldn't continue. 
                  This might be due to:
                </p>
                <ul className="mt-2 space-y-1 text-gray-400 text-sm ml-4">
                  <li>• Camera or MediaPipe initialization failure</li>
                  <li>• Network connectivity issues</li>
                  <li>• Browser compatibility problems</li>
                  <li>• Corrupted application state</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <p className="text-gray-300 text-sm font-medium">Try these solutions:</p>
                
                <button
                  onClick={this.handleReload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reload Application
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Go to Home
                </button>
              </div>

              {/* Additional help */}
              <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                <p className="text-gray-400 text-sm">
                  💡 <strong className="text-gray-300">Tip:</strong> If the problem persists:
                </p>
                <ul className="mt-2 space-y-1 text-gray-400 text-sm ml-4">
                  <li>• Clear your browser cache and cookies</li>
                  <li>• Try using a different browser</li>
                  <li>• Check your internet connection</li>
                  <li>• Ensure camera permissions are granted</li>
                  <li>• Contact support if issue continues</li>
                </ul>
              </div>

              {/* Developer info (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <summary className="text-gray-300 text-sm font-medium cursor-pointer hover:text-white">
                    Developer Info (Click to expand)
                  </summary>
                  <pre className="mt-3 text-xs text-gray-400 overflow-auto max-h-48">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-700 p-4 bg-gray-700/30 rounded-b-lg">
              <p className="text-gray-400 text-xs text-center">
                PhysioTrack AI • Error ID: {Date.now().toString(36).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
