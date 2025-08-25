-- Main entry point for the Love2D application
local AppState = require('src.core.AppState')
local BlockData = require('src.core.BlockData')
local ViewManager = require('src.core.ViewManager')
local InputHandler = require('src.input.InputHandler')
local ToolManager = require('src.tools.ToolManager')
local UIManager = require('src.ui.UIManager')

-- Global managers
local appState
local blockData
local viewManager
local inputHandler
local toolManager
local uiManager

function love.load()
    print("=== MINECRAFT CAD STARTING ===")
    
    -- Initialize core systems
    appState = AppState:new()
    blockData = BlockData:new()
    
    -- Set initial state
    appState:setSelectedBlockType('blockA')
    appState:setCurrentView('top')
    appState:setCurrentLevel(0)
    appState:setActiveTool('place')
    
    -- Initialize managers
    local viewport = {
        width = love.graphics.getWidth() or 800, 
        height = love.graphics.getHeight() or 600
    }
    print(string.format("Viewport created: %dx%d", viewport.width, viewport.height))
    viewManager = ViewManager:new(viewport, appState, blockData)
    toolManager = ToolManager:new(appState, blockData)
    inputHandler = InputHandler:new(viewport, viewManager, toolManager, appState)
    uiManager = UIManager:new(viewport, appState, blockData)
    
    -- Connect UIManager with ViewManager for proper synchronization
    uiManager:setViewManager(viewManager)
    
    -- Set current tool
    toolManager:setCurrentTool('place')
    
    -- Start with clean grid - no test blocks
    -- blockData:setBlock(0, 0, 0, 'blockA')
    -- blockData:setBlock(1, 0, 0, 'blockB')
    -- blockData:setBlock(0, 1, 0, 'blockC')
    -- blockData:setBlock(-1, 0, 0, 'blockD')
    -- blockData:setBlock(0, -1, 0, 'blockE')
    
    print("=== MINECRAFT CAD READY ===")
end

function love.update(dt)
    uiManager:update(dt)
end

function love.draw()
    -- Get current renderer and render the scene
    local currentRenderer = viewManager:getCurrentRenderer()
    if currentRenderer then
        currentRenderer:render(blockData, appState)
    end
    
    -- Render UI on top
    uiManager:render()
end

function love.mousepressed(x, y, button)
    print(string.format("MOUSE CLICK: button=%d at (%d, %d)", button, x, y))
    if not uiManager:handleMousePressed(x, y, button) then
        print("UI didn't handle mouse press, passing to InputHandler...")
        inputHandler:mousepressed(x, y, button)
    else
        print("UI handled mouse press")
    end
end

function love.mousereleased(x, y, button)
    inputHandler:mousereleased(x, y, button)
end

function love.mousemoved(x, y)
    inputHandler:mousemoved(x, y)
end

function love.wheelmoved(x, y)
    inputHandler:wheelmoved(x, y)
end

function love.keypressed(key)
    inputHandler:keypressed(key)
end

function love.resize(w, h)
    viewManager:handleResize(w, h)
    uiManager:handleResize(w, h)
end
