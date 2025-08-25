local InputHandler = {}
InputHandler.__index = InputHandler

function InputHandler:new(appState, viewManager, toolManager)
    local self = setmetatable({}, InputHandler)
    self.appState = appState
    self.viewManager = viewManager
    self.toolManager = toolManager
    
    self.mouseX = 0
    self.mouseY = 0
    self.mousePressed = false
    
    return self
end

function InputHandler:mousepressed(x, y, button)
    print(string.format("InputHandler: Mouse pressed at (%d, %d)", x, y))
    
    self.mouseX, self.mouseY = x, y
    self.mousePressed = true
    
    -- Convert screen coordinates to world coordinates
    local currentRenderer = self.viewManager:getCurrentRenderer()
    if currentRenderer then
        print("InputHandler: Converting coordinates...")
        local worldX, worldY = currentRenderer:screenToWorld(x, y)
        
        -- Pass to current tool
        local currentTool = self.toolManager:getCurrentTool()
        if currentTool then
            print(string.format("InputHandler: Calling tool %s", currentTool.name))
            currentTool:onMousePressed(worldX, worldY, button)
        else
            print("InputHandler: No current tool found!")
        end
    else
        print("InputHandler: No current renderer found!")
    end
end

function InputHandler:mousereleased(x, y, button)
    self.mousePressed = false
    
    local currentRenderer = self.viewManager:getCurrentRenderer()
    local worldX, worldY = currentRenderer:screenToWorld(x, y)
    
    local currentTool = self.toolManager:getCurrentTool()
    if currentTool then
        currentTool:onMouseReleased(worldX, worldY, button)
    end
end

function InputHandler:mousemoved(x, y)
    local dx, dy = x - self.mouseX, y - self.mouseY
    self.mouseX, self.mouseY = x, y
    
    -- Handle camera panning when middle mouse is held
    if love.mouse.isDown(3) then -- Middle mouse button
        local currentRenderer = self.viewManager:getCurrentRenderer()
        if currentRenderer and currentRenderer.camera then
            currentRenderer.camera.x = currentRenderer.camera.x - dx / currentRenderer.camera.zoom
            currentRenderer.camera.y = currentRenderer.camera.y - dy / currentRenderer.camera.zoom
        end
    end
    
    -- Pass to current tool
    local currentRenderer = self.viewManager:getCurrentRenderer()
    local worldX, worldY = currentRenderer:screenToWorld(x, y)
    
    local currentTool = self.toolManager:getCurrentTool()
    if currentTool then
        currentTool:onMouseMoved(worldX, worldY)
    end
end

function InputHandler:wheelmoved(x, y)
    -- Handle zoom
    local currentRenderer = self.viewManager:getCurrentRenderer()
    if currentRenderer and currentRenderer.camera then
        local zoomFactor = 1.1
        
        if y > 0 then
            currentRenderer.camera.zoom = currentRenderer.camera.zoom * zoomFactor
        elseif y < 0 then
            currentRenderer.camera.zoom = currentRenderer.camera.zoom / zoomFactor
        end
        
        -- Clamp zoom levels
        currentRenderer.camera.zoom = math.max(0.1, math.min(5.0, currentRenderer.camera.zoom))
    end
end

function InputHandler:keypressed(key)
    -- Handle keyboard shortcuts
    if key == 'escape' then
        love.event.quit()
    elseif key == '1' then
        self.viewManager:setCurrentView('top')
        self.appState:setCurrentView('top')
    elseif key == '2' then
        self.viewManager:setCurrentView('isometric')
        self.appState:setCurrentView('isometric')
    elseif key == 'space' then
        self.toolManager:setCurrentTool('place')
    elseif key == 'e' then
        self.toolManager:setCurrentTool('erase')
    elseif key == 'up' then
        self.appState:setCurrentLevel(math.min(49, self.appState.currentLevel + 1))
    elseif key == 'down' then
        self.appState:setCurrentLevel(math.max(0, self.appState.currentLevel - 1))
    end
end

return InputHandler
