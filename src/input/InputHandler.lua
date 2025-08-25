local InputHandler = {}
InputHandler.__index = InputHandler

function InputHandler:new(viewport, viewManager, toolManager, appState)
    local self = setmetatable({}, InputHandler)
    self.viewport = viewport
    self.viewManager = viewManager
    self.toolManager = toolManager
    self.appState = appState
    
    self.mouseX = 0
    self.mouseY = 0
    self.mousePressed = false
    self.lastMouseX = 0
    self.lastMouseY = 0
    
    return self
end

function InputHandler:mousepressed(x, y, button)
    self.mouseX, self.mouseY = x, y
    self.mousePressed = true
    
    -- Convert screen coordinates to world coordinates
    local currentRenderer = self.viewManager:getCurrentRenderer()
    if currentRenderer then
        local worldX, worldY = currentRenderer:screenToWorld(x, y)
        
        -- Pass to current tool
        local currentTool = self.toolManager:getCurrentTool()
        if currentTool then
            currentTool:onMousePressed(worldX, worldY, button)
        end
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

function InputHandler:mousemoved(x, y, dx, dy)
    -- Update mouse position in app state
    self.appState.mouseX = x
    self.appState.mouseY = y
    
    -- Handle panning with middle mouse button
    if love.mouse.isDown(3) then -- Middle mouse button (3, not 2)
        local currentRenderer = self.viewManager:getCurrentRenderer()
        if currentRenderer and currentRenderer.camera then
            -- Ensure camera has proper properties
            if not currentRenderer.camera.x then currentRenderer.camera.x = 0 end
            if not currentRenderer.camera.y then currentRenderer.camera.y = 0 end
            if not currentRenderer.camera.zoom then currentRenderer.camera.zoom = 1.0 end
            
            -- Calculate dx and dy if they're not provided
            if not dx or not dy then
                dx = x - (self.lastMouseX or x)
                dy = y - (self.lastMouseY or y)
            end
            
            -- Only pan if we have valid deltas and they're not zero
            if dx and dy and (dx ~= 0 or dy ~= 0) then
                -- Adjust panning sensitivity
                local panSensitivity = 1.0 / currentRenderer.camera.zoom
                currentRenderer.camera.x = currentRenderer.camera.x - dx * panSensitivity
                currentRenderer.camera.y = currentRenderer.camera.y - dy * panSensitivity
            end
        end
    end
    
    -- Store current position for next frame
    self.lastMouseX = x
    self.lastMouseY = y
end

function InputHandler:wheelmoved(x, y)
    -- Handle zoom
    local currentRenderer = self.viewManager:getCurrentRenderer()
    if currentRenderer and currentRenderer.camera and currentRenderer.camera.zoom then
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
    elseif key == '3' then
        self.viewManager:setCurrentView('north')
        self.appState:setCurrentView('north')
    elseif key == '4' then
        self.viewManager:setCurrentView('south')
        self.appState:setCurrentView('south')
    elseif key == '5' then
        self.viewManager:setCurrentView('east')
        self.appState:setCurrentView('east')
    elseif key == '6' then
        self.viewManager:setCurrentView('west')
        self.appState:setCurrentView('west')
    elseif key == 'space' then
        self.toolManager:setCurrentTool('place')
    elseif key == 'e' then
        self.toolManager:setCurrentTool('erase')
    elseif key == 'up' then
        local newLevel = math.min(49, self.appState.currentLevel + 1)
        self.appState:setCurrentLevel(newLevel)
    elseif key == 'down' then
        local newLevel = math.max(0, self.appState.currentLevel - 1)
        self.appState:setCurrentLevel(newLevel)
    end
end

return InputHandler
