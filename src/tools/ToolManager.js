/**
 * MinecraftCAD - Tool Manager
 * Manages all drawing and selection tools
 */

import { BlockPlacementTool } from './BlockPlacementTool.js';
import { LineTool } from './LineTool.js';
import { RectangleTool } from './RectangleTool.js';
import { FillTool } from './FillTool.js';
import { SelectionTool } from './SelectionTool.js';

export class ToolManager {
  constructor() {
    this.tools = new Map();
    this.currentTool = null;
    this.defaultTool = 'block';
    
    // Tool change listeners
    this.listeners = [];
    
    this.initializeTools();
  }

  /**
   * Initialize all available tools
   */
  initializeTools() {
    // Create tool instances
    this.tools.set('block', new BlockPlacementTool());
    this.tools.set('line', new LineTool());
    this.tools.set('rectangle', new RectangleTool());
    this.tools.set('fill', new FillTool());
    this.tools.set('selection', new SelectionTool());
    
    // Don't set default tool yet - wait until systems are connected
  }

  /**
   * Connect tool manager to other systems
   */
  connect(appStateManager, blockDataManager, inputController, uiManager) {
    this.appStateManager = appStateManager;
    this.blockDataManager = blockDataManager;
    this.inputController = inputController;
    this.uiManager = uiManager;
    
    // Connect all tools to systems
    this.tools.forEach(tool => {
      tool.connect(appStateManager, blockDataManager, inputController, uiManager);
    });
    
    // Now set the default tool after systems are connected
    this.setCurrentTool(this.defaultTool);
  }

  /**
   * Set the current active tool
   */
  setCurrentTool(toolName) {
    if (!this.tools.has(toolName)) {
      console.warn(`Tool '${toolName}' not found`);
      return false;
    }

    // Deactivate current tool
    if (this.currentTool) {
      this.currentTool.deactivate();
    }

    // Activate new tool
    this.currentTool = this.tools.get(toolName);
    this.currentTool.activate();

    // Notify listeners
    this.notifyToolChange(toolName);
    
    console.log(`Switched to ${toolName} tool`);
    return true;
  }

  /**
   * Get the current active tool
   */
  getCurrentTool() {
    return this.currentTool;
  }

  /**
   * Get tool by name
   */
  getTool(toolName) {
    return this.tools.get(toolName);
  }

  /**
   * Get all available tools
   */
  getAllTools() {
    return Array.from(this.tools.keys());
  }

  /**
   * Get tool info for UI
   */
  getToolInfo(toolName) {
    const tool = this.tools.get(toolName);
    if (!tool) return null;

    return {
      name: toolName,
      displayName: tool.displayName,
      statusText: tool.getStatusText(),
      isActive: this.currentTool === tool
    };
  }

  /**
   * Get info for all tools
   */
  getAllToolInfo() {
    return this.getAllTools().map(toolName => this.getToolInfo(toolName));
  }

  /**
   * Handle mouse down events
   */
  onMouseDown(event, worldPos) {
    if (this.currentTool) {
      this.currentTool.handleMouseDown(worldPos, event);
    }
  }

  /**
   * Handle mouse move events
   */
  onMouseMove(event, worldPos) {
    if (this.currentTool) {
      this.currentTool.handleMouseMove(worldPos, event);
    }
  }

  /**
   * Handle mouse up events
   */
  onMouseUp(event, worldPos) {
    if (this.currentTool) {
      this.currentTool.handleMouseUp(worldPos, event);
    }
  }

  /**
   * Handle right click events
   */
  onRightClick(event, worldPos) {
    if (this.currentTool) {
      this.currentTool.onRightClick(event, worldPos);
    }
  }

  /**
   * Handle key down events
   */
  onKeyDown(event) {
    // Global tool shortcuts
    if (event.key >= '1' && event.key <= '5') {
      const toolIndex = parseInt(event.key) - 1;
      const toolNames = this.getAllTools();
      if (toolIndex < toolNames.length) {
        this.setCurrentTool(toolNames[toolIndex]);
        event.preventDefault();
        return;
      }
    }

    // Tool-specific shortcuts
    switch (event.key.toLowerCase()) {
      case 'b':
        this.setCurrentTool('block');
        break;
      case 'l':
        this.setCurrentTool('line');
        break;
      case 'r':
        if (!event.ctrlKey && !event.metaKey) { // Don't interfere with Ctrl+R refresh
          this.setCurrentTool('rectangle');
        }
        break;
      case 'f':
        if (!event.ctrlKey && !event.metaKey) { // Don't interfere with Ctrl+F find
          this.setCurrentTool('fill');
        }
        break;
      case 's':
        if (!event.ctrlKey && !event.metaKey) { // Don't interfere with Ctrl+S save
          this.setCurrentTool('selection');
        }
        break;
    }

    // Pass event to current tool
    if (this.currentTool) {
      this.currentTool.onKeyDown(event);
    }
  }

  /**
   * Handle key up events
   */
  onKeyUp(event) {
    if (this.currentTool) {
      this.currentTool.onKeyUp(event);
    }
  }

  /**
   * Set current block type for all tools
   */
  setCurrentBlockType(blockType) {
    this.tools.forEach(tool => {
      if (tool.setCurrentBlockType) {
        tool.setCurrentBlockType(blockType);
      }
    });
  }

  /**
   * Handle view changes
   */
  onViewChange(viewType, level, cameraState) {
    this.tools.forEach(tool => {
      if (tool.onViewChange) {
        tool.onViewChange(viewType, level, cameraState);
      }
    });
  }

  /**
   * Add tool change listener
   */
  addToolChangeListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove tool change listener
   */
  removeToolChangeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify listeners of tool change
   */
  notifyToolChange(toolName) {
    this.listeners.forEach(callback => {
      try {
        callback(toolName, this.currentTool);
      } catch (error) {
        console.error('Error in tool change listener:', error);
      }
    });
  }

  /**
   * Get current tool status text
   */
  getCurrentToolStatus() {
    return this.currentTool ? this.currentTool.getStatusText() : 'No tool selected';
  }

  /**
   * Cleanup
   */
  destroy() {
    this.tools.forEach(tool => {
      if (tool.destroy) {
        tool.destroy();
      }
    });
    
    this.tools.clear();
    this.listeners = [];
    this.currentTool = null;
  }
}
