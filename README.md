# MinecraftCAD

A 2D/3D CAD application built with Love2D (LÖVE) for creating and visualizing block-based designs with a blueprint aesthetic.

## ✨ Features

### **Core Functionality**
- **Block Placement & Removal**: Place and remove blocks with instant feedback
- **2D Top-Down View**: Blueprint-style grid view with ghost blocks from other levels
- **3D Isometric View**: 3D perspective rendering with proper depth sorting
- **Dynamic Grid System**: Centered coordinate system that automatically grows as you build

### **Coordinate System**
- **Origin**: (0, 0) at the center of the screen
- **Initial Range**: ±30 units in all directions (60×60 grid)
- **Dynamic Growth**: Grid automatically expands as blocks are placed
- **Buffer Zone**: Always maintains 5 units of empty space around placed blocks
- **Unlimited Expansion**: No hard limits on X and Y coordinates (Z limited to 0-49)

### **Block Types**
- **5 Distinct Patterns**: Solid, diagonal, crosshatch, dots, and brick patterns
- **Visual Variety**: Each block type has unique colors and hatch patterns
- **Performance Optimized**: Efficient rendering with smart culling

### **User Interface**
- **Sidebar Controls**: Block type selection, view switching, height controls
- **Real-time Info**: Current grid extent, block count, and coordinate system status
- **Keyboard Shortcuts**: Quick access to tools and views
- **Responsive Design**: Adapts to window resizing

## 🎮 Controls

### **Mouse**
- **Left Click**: Place/remove blocks (based on active tool)
- **Middle Mouse + Drag**: Pan camera
- **Mouse Wheel**: Zoom in/out

### **Keyboard**
- **SPACE**: Switch to Place Tool
- **E**: Switch to Erase Tool
- **1**: Switch to Top View
- **2**: Switch to 3D Isometric View
- **UP/DOWN**: Change height level
- **ESC**: Quit application

### **Tools**
- **Place Tool**: Click anywhere on the grid to place blocks
- **Erase Tool**: Click on existing blocks to remove them

## 🚀 Getting Started

### **Requirements**
- Love2D 11.4+ (LÖVE)
- Lua 5.1+

### **Installation**
1. Clone this repository
2. Navigate to the project directory
3. Run with Love2D: `love .`

### **First Steps**
1. **Launch the application** - You'll see a centered grid with test blocks
2. **Explore the coordinate system** - Notice how (0,0) is at the center
3. **Place some blocks** - Try placing blocks in different areas
4. **Watch the grid grow** - The grid automatically expands as you build
5. **Switch views** - Use '1' and '2' to switch between 2D and 3D views

## 🏗️ Architecture

### **Core Modules**
- **AppState**: Centralized application state management
- **BlockData**: Efficient 3D block storage with dynamic bounds tracking
- **ViewManager**: Handles switching between 2D and 3D renderers
- **InputHandler**: Centralized input processing and camera controls
- **ToolManager**: Manages drawing tools (place, erase)
- **UIManager**: User interface rendering and interaction

### **Rendering System**
- **BaseRenderer**: Common rendering functionality and coordinate conversion
- **TopViewRenderer**: 2D blueprint-style rendering with dynamic grid
- **IsometricRenderer**: 3D isometric projection with depth sorting
- **HatchPatterns**: Visual block patterns and colors

### **Performance Features**
- **Sparse 3D Arrays**: Efficient memory usage for large designs
- **Smart Culling**: Only renders visible blocks and nearby levels
- **Dynamic Grid**: Grows automatically without performance impact
- **Bounds Tracking**: Optimized block collection and rendering

## 🔧 Development

### **Project Structure**
```
minecraft-cad/
├── main.lua                 # Main entry point
├── conf.lua                 # Love2D configuration
├── src/
│   ├── core/               # Core application modules
│   ├── rendering/          # Renderers and graphics
│   ├── tools/              # Drawing tools
│   ├── input/              # Input handling
│   └── ui/                 # User interface
└── _planning/              # Design documents
```

### **Adding New Features**
- **New Block Types**: Add to `HatchPatterns.lua`
- **New Tools**: Extend `BaseTool` class
- **New Views**: Create renderer extending `BaseRenderer`
- **UI Elements**: Add to `UIManager`

## 📊 Performance

### **Optimizations**
- **Efficient Block Storage**: Sparse arrays with smart bounds tracking
- **Smart Rendering**: Only renders visible blocks and nearby levels
- **Dynamic Grid**: Grows automatically without performance impact
- **Memory Management**: Efficient cleanup and bounds updates

### **Limits**
- **Block Count**: 500,000 blocks maximum
- **Height Levels**: 50 levels (0-49)
- **Grid Expansion**: Unlimited in X and Y directions

## 🎯 Roadmap

### **Planned Features**
- **Save/Load System**: Project file format
- **Export Options**: PNG, SVG, and 3D model export
- **Advanced Tools**: Line, fill, and selection tools
- **Measurement Tools**: Distance and area calculations
- **Elevation Views**: North, South, East, West perspectives

### **Current Status**
- ✅ Core block placement and removal
- ✅ 2D and 3D rendering
- ✅ Dynamic coordinate system
- ✅ Performance optimizations
- ✅ User interface
- 🔄 Enhanced tools and features
- 📋 Save/load functionality

## 🤝 Contributing

This project follows SOLID principles and DRY methodology. When contributing:

1. **Check existing code** before creating new functionality
2. **Follow naming conventions** and architectural patterns
3. **Add logging** for key operations and error handling
4. **Update tests** when modifying core functionality
5. **Document changes** in code comments and README

## 📄 License

[Add your license information here]

---

**MinecraftCAD** - Where precision meets creativity in block-based design.
