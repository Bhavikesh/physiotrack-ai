/**
 * Voice Feedback System
 * Handles text-to-speech feedback for exercise guidance
 */

class VoiceFeedbackSystem {
  constructor() {
    // Check browser support for Web Speech API
    const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || window.webkitSpeechSynthesisUtterance;
    const speechSynthesis = window.speechSynthesis || window.webkitSpeechSynthesis;
    
    this.supported = !!(SpeechSynthesisUtterance && speechSynthesis);
    this.synth = speechSynthesis;
    this.SpeechSynthesisUtterance = SpeechSynthesisUtterance;
    
    // Settings
    this.rate = 1.0;  // Speech rate (0.5 - 2.0)
    this.pitch = 1.0; // Pitch (0.0 - 2.0)
    this.volume = 0.9; // Volume (0.0 - 1.0)
    
    // Feedback queue to prevent overlapping
    this.feedbackQueue = [];
    this.isCurrentlySpeaking = false;
    
    // Feedback cache to avoid repeating same message too soon
    this.lastFeedback = {};
    this.feedbackCooldown = 2000; // 2 seconds minimum between same feedback
    
    console.log(`🎙️ Voice Feedback System: ${this.supported ? 'Supported ✅' : 'Not Supported ❌'}`);
  }

  /**
   * Speak text with optional cooldown to prevent spam
   */
  speak(text, options = {}) {
    if (!this.supported) {
      console.warn('⚠️ Text-to-speech not supported in this browser');
      return;
    }

    const {
      priority = 'normal',  // 'high', 'normal', 'low'
      allowDuplicate = false,
      feedbackId = text // For cooldown tracking
    } = options;

    // Check cooldown
    if (!allowDuplicate) {
      const lastTime = this.lastFeedback[feedbackId];
      if (lastTime && Date.now() - lastTime < this.feedbackCooldown) {
        return; // Skip - too soon
      }
    }

    // Add to queue based on priority
    const utterance = {
      text,
      priority,
      feedbackId,
      timestamp: Date.now()
    };

    if (priority === 'high') {
      this.feedbackQueue.unshift(utterance);
      this.synth.cancel(); // Stop current speech immediately
    } else {
      this.feedbackQueue.push(utterance);
    }

    this.processQueue();
  }

  /**
   * Process feedback queue
   */
  processQueue() {
    if (this.isCurrentlySpeaking || this.feedbackQueue.length === 0) {
      return;
    }

    const { text, feedbackId } = this.feedbackQueue.shift();
    this.isCurrentlySpeaking = true;

    const utterance = new this.SpeechSynthesisUtterance(text);
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = this.volume;

    utterance.onend = () => {
      this.isCurrentlySpeaking = false;
      this.lastFeedback[feedbackId] = Date.now();
      this.processQueue();
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      this.isCurrentlySpeaking = false;
      this.processQueue();
    };

    this.synth.speak(utterance);
  }

  /**
   * Stop current speech
   */
  stop() {
    this.synth.cancel();
    this.feedbackQueue = [];
    this.isCurrentlySpeaking = false;
  }

  /**
   * Set speech rate
   */
  setRate(rate) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  /**
   * Set volume
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1.0, volume));
  }
}

export default VoiceFeedbackSystem;
