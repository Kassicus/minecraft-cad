/**
 * MinecraftCAD - Hatch Pattern Manager
 * Manages hatch patterns for different block types in 2D and 3D views
 */

export class HatchPatternManager {
  constructor() {
    // Pattern definitions
    this.patterns = {
      solid: { type: 'fill', color: '#666' },
      diagonal: { type: 'lines', angle: 45, spacing: 8, color: '#888' },
      crosshatch: { type: 'lines', angle: [45, -45], spacing: 8, color: '#444' },
      dots: { type: 'dots', size: 2, spacing: 8, color: '#555' },
      brick: { type: 'custom', pattern: 'brick', color: '#777' }
    };
    
    // Block type to pattern mapping
    this.blockPatterns = {
      blockA: 'solid',
      blockB: 'diagonal', 
      blockC: 'crosshatch',
      blockD: 'dots',
      blockE: 'brick'
    };
    
    // Canvas pattern cache for performance
    this.patternCache = new Map();
    
    // Pattern scale factors for different zoom levels
    this.scaleFactors = {
      small: 0.5,
      normal: 1.0,
      large: 1.5,
      xlarge: 2.0
    };
  }

  /**
   * Get the pattern type for a block type
   */
  getPatternForBlock(blockType) {
    return this.blockPatterns[blockType] || 'solid';
  }

  /**
   * Get the color for a block type
   */
  getColorForBlock(blockType) {
    const patternType = this.getPatternForBlock(blockType);
    return this.patterns[patternType]?.color || '#666';
  }

  /**
   * Create a canvas pattern for 2D rendering
   */
  createCanvasPattern(context, patternType, scale = 1.0, alpha = 1.0) {
    const cacheKey = `${patternType}_${scale}_${alpha}`;
    
    if (this.patternCache.has(cacheKey)) {
      return this.patternCache.get(cacheKey);
    }
    
    const pattern = this.generatePattern(patternType, scale, alpha);
    this.patternCache.set(cacheKey, pattern);
    
    return pattern;
  }

  /**
   * Generate a pattern based on type and scale
   */
  generatePattern(patternType, scale = 1.0, alpha = 1.0) {
    const patternDef = this.patterns[patternType];
    if (!patternDef) return null;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const baseSize = 16;
    const size = Math.max(4, Math.round(baseSize * scale));
    
    canvas.width = size;
    canvas.height = size;
    
    // Set global alpha
    ctx.globalAlpha = alpha;
    
    switch (patternDef.type) {
      case 'fill':
        this.drawSolidPattern(ctx, size, patternDef.color);
        break;
      case 'lines':
        this.drawLinePattern(ctx, size, patternDef);
        break;
      case 'dots':
        this.drawDotPattern(ctx, size, patternDef);
        break;
      case 'custom':
        this.drawCustomPattern(ctx, size, patternDef);
        break;
    }
    
    return canvas;
  }

  /**
   * Draw solid fill pattern
   */
  drawSolidPattern(ctx, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
  }

  /**
   * Draw line pattern (diagonal, crosshatch)
   */
  drawLinePattern(ctx, size, patternDef) {
    ctx.strokeStyle = patternDef.color;
    ctx.lineWidth = 1;
    
    const angles = Array.isArray(patternDef.angle) ? patternDef.angle : [patternDef.angle];
    const spacing = Math.max(2, Math.round(patternDef.spacing * (size / 16)));
    
    for (const angle of angles) {
      this.drawLinesAtAngle(ctx, size, angle, spacing);
    }
  }

  /**
   * Draw lines at a specific angle
   */
  drawLinesAtAngle(ctx, size, angle, spacing) {
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((angle * Math.PI) / 180);
    
    const diagonal = Math.sqrt(size * size + size * size);
    const lineCount = Math.ceil(diagonal / spacing);
    
    ctx.beginPath();
    for (let i = -lineCount; i <= lineCount; i++) {
      const y = i * spacing;
      ctx.moveTo(-diagonal, y);
      ctx.lineTo(diagonal, y);
    }
    ctx.stroke();
    
    ctx.restore();
  }

  /**
   * Draw dot pattern
   */
  drawDotPattern(ctx, size, patternDef) {
    ctx.fillStyle = patternDef.color;
    
    const spacing = Math.max(3, Math.round(patternDef.spacing * (size / 16)));
    const dotSize = Math.max(1, Math.round(patternDef.size * (size / 16)));
    
    for (let x = spacing / 2; x < size; x += spacing) {
      for (let y = spacing / 2; y < size; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * Draw custom patterns (brick, etc.)
   */
  drawCustomPattern(ctx, size, patternDef) {
    switch (patternDef.pattern) {
      case 'brick':
        this.drawBrickPattern(ctx, size, patternDef.color);
        break;
      default:
        this.drawSolidPattern(ctx, size, patternDef.color);
    }
  }

  /**
   * Draw brick pattern
   */
  drawBrickPattern(ctx, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    
    const brickHeight = Math.max(3, Math.round(size / 4));
    const brickWidth = Math.max(6, Math.round(size / 2));
    
    ctx.beginPath();
    
    // Draw horizontal lines
    for (let y = 0; y <= size; y += brickHeight) {
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
    }
    
    // Draw vertical lines with offset pattern
    for (let row = 0; row <= Math.ceil(size / brickHeight); row++) {
      const y = row * brickHeight;
      const offset = (row % 2) * (brickWidth / 2);
      
      for (let x = offset; x <= size + brickWidth; x += brickWidth) {
        if (x >= 0 && x <= size) {
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + brickHeight);
        }
      }
    }
    
    ctx.stroke();
  }

  /**
   * Fill a rectangle with a pattern
   */
  fillRectWithPattern(context, x, y, width, height, blockType, scale = 1.0, alpha = 1.0) {
    const patternType = this.getPatternForBlock(blockType);
    
    if (patternType === 'solid') {
      // Simple solid fill for performance
      context.fillStyle = this.hexToRgba(this.getColorForBlock(blockType), alpha);
      context.fillRect(x, y, width, height);
      return;
    }
    
    // Create pattern and fill
    const patternCanvas = this.createCanvasPattern(context, patternType, scale, alpha);
    if (patternCanvas) {
      const pattern = context.createPattern(patternCanvas, 'repeat');
      if (pattern) {
        context.fillStyle = pattern;
        context.fillRect(x, y, width, height);
      }
    }
  }

  /**
   * Stroke a rectangle with a pattern (for outlines)
   */
  strokeRectWithPattern(context, x, y, width, height, blockType, lineWidth = 1, alpha = 1.0) {
    context.strokeStyle = this.hexToRgba(this.getColorForBlock(blockType), alpha);
    context.lineWidth = lineWidth;
    context.strokeRect(x, y, width, height);
  }

  /**
   * Get appropriate scale factor based on zoom level
   */
  getScaleForZoom(zoom) {
    if (zoom < 0.5) return this.scaleFactors.small;
    if (zoom > 2.0) return this.scaleFactors.large;
    if (zoom > 4.0) return this.scaleFactors.xlarge;
    return this.scaleFactors.normal;
  }

  /**
   * Get solid color for 3D rendering (patterns simplified to colors)
   */
  getSolidColorForPattern(patternType) {
    return this.patterns[patternType]?.color || '#666';
  }

  /**
   * Get solid color for block type (for 3D rendering)
   */
  getSolidColorForBlock(blockType) {
    const patternType = this.getPatternForBlock(blockType);
    return this.getSolidColorForPattern(patternType);
  }

  /**
   * Convert hex color to rgba
   */
  hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Add a new pattern definition
   */
  addPattern(name, definition) {
    this.patterns[name] = definition;
    // Clear cache to force regeneration
    this.patternCache.clear();
  }

  /**
   * Add a new block type mapping
   */
  addBlockPattern(blockType, patternType) {
    this.blockPatterns[blockType] = patternType;
  }

  /**
   * Clear pattern cache (useful when patterns change)
   */
  clearCache() {
    this.patternCache.clear();
  }

  /**
   * Get all available patterns
   */
  getAvailablePatterns() {
    return Object.keys(this.patterns);
  }

  /**
   * Get all block type mappings
   */
  getBlockPatterns() {
    return { ...this.blockPatterns };
  }

  /**
   * Create a pattern preview canvas
   */
  createPatternPreview(patternType, width = 40, height = 20) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    // Fill with pattern
    const patternCanvas = this.generatePattern(patternType, 1.0, 1.0);
    if (patternCanvas) {
      const pattern = ctx.createPattern(patternCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
    }
    
    // Add border
    ctx.strokeStyle = '#64b5f6';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
    
    return canvas;
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.patternCache.clear();
  }
}
