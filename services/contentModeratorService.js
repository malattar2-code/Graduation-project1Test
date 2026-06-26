// services/contentModeratorService.js - CUSTOM SOLUTION
const sharp = require('sharp');

class ContentModerator {
  constructor() {
    // Custom profanity list
    this.badWords = new Set([
      // English profanity
      'asshole', 'bastard', 'bitch', 'bullshit', 'cunt', 'dick', 'fuck', 'motherfucker', 
      'nigga', 'nigger', 'pussy', 'shit', 'slut', 'whore', 'retard', 'fag', 'faggot',
      'damn', 'hell', 'crap', 'douche', 'wanker', 'twat', 'bollocks',
      
      // Arabic profanity (transliterated)
      'kos', 'kosomak', 'sharmouta', 'sharmoota', 'ahbal', 'ibn', 'ya ibn', 
      'kesek', 'kesekht', 'zab', 'zabb', 'zabar', 'manyak', 'mnayek', 'arse',
      'khalq', 'haram', 'harami', 'mush', 'mushkila',
      
      // Sexual content
      'porn', 'porno', 'pornography', 'xxx', 'sex', 'sexual', 'nude', 'naked',
      'adult', 'explicit', 'nsfw', 'hentai', 'erotic', 'orgy', 'masturbat',
      'blowjob', 'handjob', 'boobs', 'breasts', 'penis', 'vagina',
      
      // Offensive terms
      'kill', 'murder', 'terrorist', 'bomb', 'drugs', 'weed', 'cocaine', 'heroin',
      'suicide', 'kill myself', 'die', 'death', 'violence', 'attack',
      
      // Hate speech
      'hate', 'racist', 'racism', 'nazi', 'hitler', 'kkk', 'white power'
    ]);

    // Patterns for more complex detection
    this.inappropriatePatterns = [
      // English patterns
      { pattern: /nude|naked|nudity/i, message: 'Contains inappropriate content' },
      { pattern: /porn|xxx|sexually|erotic/i, message: 'Contains explicit references' },
      { pattern: /fuck|shit|bitch|asshole|cunt|dick|pussy/i, message: 'Contains offensive language' },
      { pattern: /kill|murder|terrorist|bomb/i, message: 'Contains violent content' },
      { pattern: /drugs|weed|cocaine|heroin/i, message: 'Contains drug references' },
      { pattern: /suicide|kill myself|die/i, message: 'Contains self-harm references' },
      
      // Arabic profanity patterns (transliterated)
      { pattern: /kos|koss|qos|qoss/i, message: 'Contains inappropriate content' },
      { pattern: /sharmouta|sharmoota|sharmuta/i, message: 'Contains inappropriate content' },
      { pattern: /zab|zabb|zabar/i, message: 'Contains inappropriate content' },
      { pattern: /manyak|mnayek|manyak/i, message: 'Contains inappropriate content' },
      { pattern: /ahbal|ibn el|ya ibn/i, message: 'Contains inappropriate content' },
      
      // Hate speech patterns
      { pattern: /nigger|nigga|fag|faggot/i, message: 'Contains hate speech' },
      { pattern: /nazi|hitler|kkk|white power/i, message: 'Contains hate speech' }
    ];

    this.isLoaded = true;
    console.log(`✅ Custom content moderator loaded with ${this.badWords.size} blocked words`);
  }

  async loadModels() {
    this.isLoaded = true;
    console.log('✅ Content moderator ready');
    return true;
  }

  async ensureModelsLoaded() {
    return true;
  }

  /**
   * Check if text contains profanity
   */
  containsProfanity(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const lowerText = text.toLowerCase().trim();
    
    // Check against bad words list
    for (const word of this.badWords) {
      if (lowerText.includes(word.toLowerCase())) {
        return true;
      }
    }

    // Check against patterns
    for (const { pattern } of this.inappropriatePatterns) {
      if (pattern.test(lowerText)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check text for inappropriate content
   */
  async checkText(text) {
    const violations = [];

    if (!text || typeof text !== 'string') {
      return violations;
    }

    const lowerText = text.toLowerCase().trim();

    // 1. Check against bad words list
    for (const word of this.badWords) {
      if (lowerText.includes(word.toLowerCase())) {
        violations.push({
          type: 'profanity',
          level: 'high',
          message: 'Content contains inappropriate language'
        });
        return violations; // Early return for quick rejection
      }
    }

    // 2. Check against patterns
    this.inappropriatePatterns.forEach(({ pattern, message }) => {
      if (pattern.test(lowerText)) {
        violations.push({
          type: 'inappropriate_content',
          level: 'high',
          message: message
        });
      }
    });

    // 3. Check for excessive special characters (potential bypass attempts)
    const specialCharRatio = (lowerText.replace(/[a-z0-9\s]/g, '').length / Math.max(lowerText.length, 1));
    if (specialCharRatio > 0.3 && lowerText.length > 5) {
      violations.push({
        type: 'suspicious_format',
        level: 'medium', 
        message: 'Text contains suspicious formatting'
      });
    }

    return violations;
  }

  /**
   * Basic image validation using sharp
   */
  async checkImage(imageBuffer) {
    const violations = [];

    try {
      // Use sharp to get image metadata for basic validation
      const metadata = await sharp(imageBuffer).metadata();
      
      // Check image dimensions (prevent extremely large images)
      if (metadata.width > 5000 || metadata.height > 5000) {
        violations.push({
          type: 'image_size',
          level: 'medium',
          message: 'Image dimensions too large'
        });
      }

      // Check file size (approximately)
      if (imageBuffer.length > 10 * 1024 * 1024) { // 10MB limit
        violations.push({
          type: 'file_size',
          level: 'medium',
          message: 'Image file too large'
        });
      }

      // Basic format validation
      const allowedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
      if (!allowedFormats.includes(metadata.format)) {
        violations.push({
          type: 'file_format',
          level: 'medium',
          message: `Unsupported image format: ${metadata.format}`
        });
      }

    } catch (error) {
      console.error('Error in image validation:', error);
      violations.push({
        type: 'processing_error',
        level: 'medium',
        message: 'Unable to process image'
      });
    }

    return violations;
  }

  /**
   * Validate user registration data
   */
  async validateUserRegistration(userData) {
    const violations = [];
    const { firstName, lastName, email, userImage } = userData;

    try {
      // Check full name
      if (firstName && lastName) {
        const fullName = `${firstName} ${lastName}`.trim();
        const nameViolations = await this.checkText(fullName);
        violations.push(...nameViolations.map(v => ({ ...v, field: 'name' })));
      }

      // Check first name separately
      if (firstName) {
        const firstNameViolations = await this.checkText(firstName);
        violations.push(...firstNameViolations.map(v => ({ ...v, field: 'first_name' })));
      }

      // Check last name separately  
      if (lastName) {
        const lastNameViolations = await this.checkText(lastName);
        violations.push(...lastNameViolations.map(v => ({ ...v, field: 'last_name' })));
      }

      // Check email
      if (email) {
        const emailViolations = await this.checkText(email);
        violations.push(...emailViolations.map(v => ({ ...v, field: 'email' })));
      }

      // Check profile image if provided
      if (userImage && userImage.buffer) {
        const imageViolations = await this.checkImage(userImage.buffer);
        violations.push(...imageViolations.map(v => ({ ...v, field: 'profile_image' })));
      }

    } catch (error) {
      console.error('Error in content moderation:', error);
      // Don't block registration if moderation fails
    }

    return {
      hasViolations: violations.length > 0,
      violations: violations,
      isBanned: violations.some(v => v.level === 'high')
    };
  }

  /**
   * Get moderation summary for admin
   */
  getModerationSummary(violations) {
    if (violations.length === 0) {
      return { status: 'clean', message: 'No violations detected' };
    }

    const highSeverity = violations.filter(v => v.level === 'high');
    const mediumSeverity = violations.filter(v => v.level === 'medium');

    if (highSeverity.length > 0) {
      return {
        status: 'banned',
        message: `Account suspended due to ${highSeverity.length} content policy violation(s)`
      };
    }

    if (mediumSeverity.length > 0) {
      return {
        status: 'warning',
        message: `${violations.length} content warnings detected`
      };
    }

    return {
      status: 'clean',
      message: 'No serious violations detected'
    };
  }

  /**
   * Add custom words to filter (for admin panel)
   */
  addCustomWords(words) {
    if (Array.isArray(words)) {
      words.forEach(word => {
        if (typeof word === 'string' && word.trim()) {
          this.badWords.add(word.toLowerCase().trim());
        }
      });
    }
  }

  /**
   * Get filter statistics (for admin panel)
   */
  getFilterStats() {
    return {
      filterType: 'Custom Profanity Filter',
      libraries: ['sharp'],
      capabilities: ['Text profanity detection', 'Basic image validation'],
      blockedWordsCount: this.badWords.size,
      patternsCount: this.inappropriatePatterns.length,
      aiEnabled: false,
      status: 'active'
    };
  }
}

// Create and initialize instance
const contentModerator = new ContentModerator();
module.exports = contentModerator;