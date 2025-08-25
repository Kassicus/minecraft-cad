local UIManager = {}
UIManager.__index = UIManager

function UIManager:new(viewport, appState, blockData)
    local o = {}
    setmetatable(o, self)
    self.__index = self
    
    o.viewport = viewport
    o.appState = appState
    o.blockData = blockData
    o.hoverStates = {}
    
    return o
end

function UIManager:update(dt)
    -- Update hover states based on mouse position
    self:updateHoverStates()
end

function UIManager:render()
    love.graphics.push()
    
    -- Draw sidebar
    self:drawSidebar()
    
    -- Draw status bar
    self:drawStatusBar()
    
    love.graphics.pop()
end

function UIManager:drawSidebar()
    local sidebarWidth = 200
    local x = self.viewport.width - sidebarWidth
    local y = 0
    
    -- Sidebar background
    love.graphics.setColor(0.2, 0.2, 0.3, 0.9)
    love.graphics.rectangle('fill', x, y, sidebarWidth, self.viewport.height)
    
    -- Sidebar border
    love.graphics.setColor(0.4, 0.4, 0.6, 1)
    love.graphics.rectangle('line', x, y, sidebarWidth, self.viewport.height)
    
    -- Block type selection panel
    self:drawBlockTypePanel(x + 10, y + 20)
    
    -- View control panel
    self:drawViewControlPanel(x + 10, y + 200)
    
    -- Height controls
    self:drawHeightControls(x + 10, y + 300)
    
    -- Grid info
    self:drawGridInfo(x + 10, y + 400)
end

function UIManager:drawStatusBar()
    local barHeight = 30
    local y = self.viewport.height - barHeight
    
    -- Status bar background
    love.graphics.setColor(0.1, 0.1, 0.2, 0.9)
    love.graphics.rectangle('fill', 0, y, self.viewport.width, barHeight)
    
    -- Status bar border
    love.graphics.setColor(0.4, 0.4, 0.6, 1)
    love.graphics.rectangle('line', 0, y, self.viewport.width, barHeight)
    
    -- Status text
    love.graphics.setColor(1, 1, 1, 1)
    love.graphics.setFont(love.graphics.getFont())
    
    local statusText = string.format("View: %s | Level: %d | Tool: %s | Blocks: %d", 
        self.appState.currentView, 
        self.appState.currentLevel, 
        self.appState.activeTool or "None",
        self.blockData:getBlockCount())
    
    love.graphics.print(statusText, 10, y + 8)
    
    -- Mouse coordinates
    local mouseText = string.format("Mouse: (%d, %d)", 
        self.appState.mouseX or 0, 
        self.appState.mouseY or 0)
    love.graphics.print(mouseText, self.viewport.width - 150, y + 8)
end

function UIManager:drawBlockTypePanel(x, y)
    love.graphics.setColor(1, 1, 1, 1)
    love.graphics.print("Block Types", x, y)
    
    local blockTypes = {"blockA", "blockB", "blockC", "blockD", "blockE"}
    local buttonY = y + 30
    
    for i, blockType in ipairs(blockTypes) do
        local isSelected = self.appState.selectedBlockType == blockType
        local isHovered = self.hoverStates[blockType]
        
        self:drawButton(x, buttonY, 180, 25, blockType, isSelected, isHovered)
        buttonY = buttonY + 30
    end
end

function UIManager:drawViewControlPanel(x, y)
    love.graphics.setColor(1, 1, 1, 1)
    love.graphics.print("Views", x, y)
    
    local views = {"top", "isometric"}
    local buttonY = y + 30
    
    for i, view in ipairs(views) do
        local isSelected = self.appState.currentView == view
        local isHovered = self.hoverStates[view]
        
        self:drawButton(x, buttonY, 180, 25, view, isSelected, isHovered)
        buttonY = buttonY + 30
    end
end

function UIManager:drawButton(x, y, width, height, text, isSelected, isHovered)
    -- Button background
    if isSelected then
        love.graphics.setColor(0.3, 0.6, 1.0, 1)
    elseif isHovered then
        love.graphics.setColor(0.4, 0.4, 0.6, 1)
    else
        love.graphics.setColor(0.3, 0.3, 0.5, 1)
    end
    
    love.graphics.rectangle('fill', x, y, width, height)
    
    -- Button border
    love.graphics.setColor(0.6, 0.6, 0.8, 1)
    love.graphics.rectangle('line', x, y, width, height)
    
    -- Button text
    love.graphics.setColor(1, 1, 1, 1)
    local textWidth = love.graphics.getFont():getWidth(text)
    local textX = x + (width - textWidth) / 2
    local textY = y + (height - love.graphics.getFont():getHeight()) / 2
    love.graphics.print(text, textX, textY)
end

function UIManager:drawHeightControls(x, y)
    love.graphics.setColor(1, 1, 1, 1)
    love.graphics.print("Height Controls", x, y)
    
    -- Level display
    love.graphics.print(string.format("Level: %d", self.appState.currentLevel), x, y + 30)
    
    -- Up/Down buttons
    self:drawButton(x, y + 60, 80, 25, "Up", false, self.hoverStates["heightUp"])
    self:drawButton(x + 90, y + 60, 80, 25, "Down", false, self.hoverStates["heightDown"])
end

function UIManager:drawGridInfo(x, y)
    love.graphics.setColor(1, 1, 1, 1)
    love.graphics.print("GRID INFO", x, y)
    
    local bounds = self.blockData:getBounds()
    love.graphics.print(string.format("X: %d to %d", bounds.minX or 0, bounds.maxX or 0), x, y + 20)
    love.graphics.print(string.format("Y: %d to %d", bounds.minY or 0, bounds.maxY or 0), x, y + 40)
    love.graphics.print(string.format("Blocks: %d", self.blockData:getBlockCount()), x, y + 60)
end

function UIManager:updateHoverStates()
    local mouseX = love.mouse.getX()
    local mouseY = love.mouse.getY()
    
    -- Check block type buttons
    local blockTypes = {"blockA", "blockB", "blockC", "blockD", "blockE"}
    local sidebarX = self.viewport.width - 200
    
    for i, blockType in ipairs(blockTypes) do
        local buttonY = 50 + (i - 1) * 30
        self.hoverStates[blockType] = self:isPointInRect(mouseX, mouseY, sidebarX + 10, buttonY, 180, 25)
    end
    
    -- Check view buttons
    local views = {"top", "isometric"}
    for i, view in ipairs(views) do
        local buttonY = 230 + (i - 1) * 30
        self.hoverStates[view] = self:isPointInRect(mouseX, mouseY, sidebarX + 10, buttonY, 180, 25)
    end
    
    -- Check height control buttons
    self.hoverStates["heightUp"] = self:isPointInRect(mouseX, mouseY, sidebarX + 10, 360, 80, 25)
    self.hoverStates["heightDown"] = self:isPointInRect(mouseX, mouseY, sidebarX + 100, 360, 80, 25)
end

function UIManager:isPointInRect(px, py, rx, ry, rw, rh)
    return px >= rx and px <= rx + rw and py >= ry and py <= ry + rh
end

function UIManager:handleResize(width, height)
    self.viewport.width = width
    self.viewport.height = height
end

function UIManager:handleMousePressed(x, y, button)
    if button == 1 then -- Left click
        local sidebarX = self.viewport.width - 200
        
        -- Check block type clicks
        local blockTypes = {"blockA", "blockB", "blockC", "blockD", "blockE"}
        for i, blockType in ipairs(blockTypes) do
            local buttonY = 50 + (i - 1) * 30
            if self:isPointInRect(x, y, sidebarX + 10, buttonY, 180, 25) then
                self:handleBlockTypeClick(blockType)
                return true
            end
        end
        
        -- Check view control clicks
        local views = {"top", "isometric"}
        for i, view in ipairs(views) do
            local buttonY = 230 + (i - 1) * 30
            if self:isPointInRect(x, y, sidebarX + 10, buttonY, 180, 25) then
                self:handleViewControlClick(view)
                return true
            end
        end
        
        -- Check height control clicks
        if self:isPointInRect(x, y, sidebarX + 10, 360, 80, 25) then
            self:handleHeightUpClick()
            return true
        end
        
        if self:isPointInRect(x, y, sidebarX + 100, 360, 80, 25) then
            self:handleHeightDownClick()
            return true
        end
    end
    
    return false
end

function UIManager:handleBlockTypeClick(blockType)
    self.appState:setSelectedBlockType(blockType)
end

function UIManager:handleViewControlClick(view)
    self.appState:setCurrentView(view)
end

function UIManager:handleHeightUpClick()
    local newLevel = math.min(49, self.appState.currentLevel + 1)
    self.appState:setCurrentLevel(newLevel)
end

function UIManager:handleHeightDownClick()
    local newLevel = math.max(0, self.appState.currentLevel - 1)
    self.appState:setCurrentLevel(newLevel)
end

return UIManager
