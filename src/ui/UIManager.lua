local UIManager = {}
UIManager.__index = UIManager

-- Layout constants matching wireframe exactly
local LAYOUT = {
    SIDEBAR_WIDTH = 280,
    PANEL_HEADER_HEIGHT = 45,
    PANEL_PADDING = 15,
    BLOCK_GRID_GAP = 10,
    BLOCK_ITEM_HEIGHT = 60,
    VIEW_BUTTON_HEIGHT = 35,
    HEIGHT_BUTTON_SIZE = 30,
    TOOLBAR_HEIGHT = 45,
    WORKSPACE_HEADER_HEIGHT = 45,
    STATUS_BAR_HEIGHT = 30
}

function UIManager:new(viewport, appState, blockData)
    local o = {}
    setmetatable(o, self)
    self.__index = self
    
    o.viewport = viewport
    o.appState = appState
    o.blockData = blockData
    o.hoverStates = {}
    o.viewManager = nil -- Will be set by main.lua
    o.toolManager = nil -- Will be set by main.lua
    
    return o
end

function UIManager:setViewManager(viewManager)
    self.viewManager = viewManager
end

function UIManager:setToolManager(toolManager)
    self.toolManager = toolManager
end

function UIManager:update(dt)
    -- Update hover states based on mouse position
    self:updateHoverStates()
end

function UIManager:render()
    love.graphics.push()
    
    -- Draw top toolbar
    self:drawToolbar()
    
    -- Draw sidebar
    self:drawSidebar()
    
    -- Draw workspace header
    self:drawWorkspaceHeader()
    
    -- Draw status bar
    self:drawStatusBar()
    
    love.graphics.pop()
end

function UIManager:drawToolbar()
    -- Position toolbar below the workspace header
    local y = LAYOUT.WORKSPACE_HEADER_HEIGHT
    local height = LAYOUT.TOOLBAR_HEIGHT + 25 -- Extra height for labels
    
    -- Toolbar background - match wireframe #1e3a5f
    love.graphics.setColor(0.118, 0.229, 0.373, 1.0)
    love.graphics.rectangle('fill', LAYOUT.SIDEBAR_WIDTH, y, self.viewport.width - LAYOUT.SIDEBAR_WIDTH, height)
    
    -- Toolbar border - match wireframe #64b5f6
    love.graphics.setColor(0.392, 0.71, 0.965, 1)
    love.graphics.rectangle('line', LAYOUT.SIDEBAR_WIDTH, y, self.viewport.width - LAYOUT.SIDEBAR_WIDTH, height)
    
    -- Tool groups
    local x = LAYOUT.SIDEBAR_WIDTH + 20
    local gap = 15
    
    -- Place/Erase tools
    self:drawToolGroup(x, y + 5, {
        {symbol = "■", tool = "place", title = "Place"},
        {symbol = "⌫", tool = "erase", title = "Erase"}
    })
    x = x + 80 + gap
    
    -- Drawing tools
    self:drawToolGroup(x, y + 5, {
        {symbol = "╱", tool = "line", title = "Line"},
        {symbol = "▢", tool = "rectangle", title = "Rect"},
        {symbol = "●", tool = "circle", title = "Circle"},
        {symbol = "▣", tool = "fill", title = "Fill"}
    })
    x = x + 160 + gap
    
    -- Utility tools
    self:drawToolGroup(x, y + 5, {
        {symbol = "📏", tool = "measure", title = "Measure"},
        {symbol = "✋", tool = "pan", title = "Pan"},
        {symbol = "🔍", tool = "zoom", title = "Zoom"}
    })
end

function UIManager:drawToolGroup(x, y, tools)
    local toolSize = 35
    local gap = 5
    local labelHeight = 20
    
    for i, tool in ipairs(tools) do
        local toolX = x + (i - 1) * (toolSize + gap)
        local isActive = self.appState.activeTool == tool.tool
        local isHovered = self.hoverStates[tool.tool]
        
        -- Tool button background
        if isActive then
            love.graphics.setColor(0.392, 0.71, 0.965, 0.3) -- #64b5f6 with 30% transparency
        elseif isHovered then
            love.graphics.setColor(0.392, 0.71, 0.965, 0.1) -- #64b5f6 with 10% transparency
        else
            love.graphics.setColor(0.118, 0.229, 0.373, 1.0) -- #1e3a5f
        end
        
        love.graphics.rectangle('fill', toolX, y, toolSize, toolSize)
        
        -- Tool button border
        love.graphics.setColor(0.392, 0.71, 0.965, 1) -- #64b5f6
        love.graphics.rectangle('line', toolX, y, toolSize, toolSize)
        
        -- Tool symbol
        love.graphics.setColor(0.91, 0.957, 0.973, 1) -- #e8f4f8
        love.graphics.print(tool.symbol, toolX + 8, y + 8)
        
        -- Tool label below the button
        love.graphics.setColor(0.91, 0.957, 0.973, 0.8) -- #e8f4f8 with 80% opacity
        local labelX = toolX + (toolSize - love.graphics.getFont():getWidth(tool.title)) / 2
        love.graphics.print(tool.title, labelX, y + toolSize + 2)
    end
    
    -- Right border for tool group
    love.graphics.setColor(0.392, 0.71, 0.965, 1) -- #64b5f6
    local groupWidth = #tools * toolSize + (#tools - 1) * gap
    love.graphics.line(x + groupWidth, y, x + groupWidth, y + toolSize + labelHeight)
end

function UIManager:drawSidebar()
    local x = 0
    local y = 0
    
    -- Sidebar background - match wireframe #122032 exactly
    love.graphics.setColor(0.07, 0.125, 0.196, 1.0)
    love.graphics.rectangle('fill', x, y, LAYOUT.SIDEBAR_WIDTH, self.viewport.height)
    
    -- Sidebar border - match wireframe #64b5f6
    love.graphics.setColor(0.392, 0.71, 0.965, 1)
    love.graphics.rectangle('line', x, y, LAYOUT.SIDEBAR_WIDTH, self.viewport.height)
    
    -- Block Types Panel
    self:drawBlockTypesPanel(x, y)
    
    -- View Controls Panel - positioned after block types panel
    local blockPanelHeight = LAYOUT.PANEL_HEADER_HEIGHT + 180 -- Block types panel height
    self:drawViewControlsPanel(x, y + blockPanelHeight)
end

function UIManager:drawBlockTypesPanel(x, y)
    -- Panel header background - match wireframe #1e3a5f
    love.graphics.setColor(0.118, 0.229, 0.373, 1.0)
    love.graphics.rectangle('fill', x, y, LAYOUT.SIDEBAR_WIDTH, LAYOUT.PANEL_HEADER_HEIGHT)
    
    -- Panel header border
    love.graphics.setColor(0.392, 0.71, 0.965, 1) -- #64b5f6
    love.graphics.rectangle('line', x, y, LAYOUT.SIDEBAR_WIDTH, LAYOUT.PANEL_HEADER_HEIGHT)
    
    -- Panel header text
    love.graphics.setColor(0.91, 0.957, 0.973, 1) -- #e8f4f8
    love.graphics.print("Block Types", x + 12, y + 12)
    
    -- Panel content - increased height to fit all 5 blocks
    local contentY = y + LAYOUT.PANEL_HEADER_HEIGHT
    local contentHeight = 180 -- Increased from 140 to 180
    
    -- Panel content background
    love.graphics.setColor(0.07, 0.125, 0.196, 1.0) -- #122032
    love.graphics.rectangle('fill', x, contentY, LAYOUT.SIDEBAR_WIDTH, contentHeight)
    
    -- Panel content border
    love.graphics.setColor(0.392, 0.71, 0.965, 1) -- #64b5f6
    love.graphics.rectangle('line', x, contentY, LAYOUT.SIDEBAR_WIDTH, contentHeight)
    
    -- Block grid
    local blockTypes = {"blockA", "blockB", "blockC", "blockD", "blockE"}
    local cols = 2
    local blockWidth = (LAYOUT.SIDEBAR_WIDTH - LAYOUT.PANEL_PADDING * 2 - LAYOUT.BLOCK_GRID_GAP) / cols
    
    for i, blockType in ipairs(blockTypes) do
        local col = (i - 1) % cols
        local row = math.floor((i - 1) / cols)
        local blockX = x + LAYOUT.PANEL_PADDING + col * (blockWidth + LAYOUT.BLOCK_GRID_GAP)
        local blockY = contentY + LAYOUT.PANEL_PADDING + row * (LAYOUT.BLOCK_ITEM_HEIGHT + LAYOUT.BLOCK_GRID_GAP)
        
        local isSelected = self.appState.selectedBlockType == blockType
        local isHovered = self.hoverStates[blockType]
        
        self:drawBlockItem(blockX, blockY, blockWidth, LAYOUT.BLOCK_ITEM_HEIGHT, blockType, isSelected, isHovered)
    end
end

function UIManager:drawBlockItem(x, y, width, height, blockType, isSelected, isHovered)
    -- Block item background
    if isSelected then
        love.graphics.setColor(0.392, 0.71, 0.965, 0.2) -- #64b5f6 with 20% transparency
    elseif isHovered then
        love.graphics.setColor(0.392, 0.71, 0.965, 0.1) -- #64b5f6 with 10% transparency
    else
        love.graphics.setColor(0.07, 0.125, 0.196, 1.0) -- #122032
    end
    
    love.graphics.rectangle('fill', x, y, width, height)
    
    -- Block item border
    love.graphics.setColor(0.392, 0.71, 0.965, 1) -- #64b5f6
    love.graphics.rectangle('line', x, y, width, height)
    
    -- Pattern preview (simplified)
    local patternSize = math.min(width, height) * 0.4
    local patternX = x + (width - patternSize) / 2
    local patternY = y + 8
    
    -- Pattern background - match wireframe pattern colors
    love.graphics.setColor(0.4, 0.4, 0.4, 1) -- #666
    love.graphics.rectangle('fill', patternX, patternY, patternSize, patternSize)
    love.graphics.setColor(0.267, 0.267, 0.267, 1) -- #444
    love.graphics.rectangle('line', patternX, patternY, patternSize, patternSize)
    
    -- Block type text
    love.graphics.setColor(0.91, 0.957, 0.973, 1) -- #e8f4f8
    local textX = x + width / 2
    local textY = y + height - 20
    love.graphics.printf(blockType, textX - 30, textY, 60, "center")
end

function UIManager:drawViewControlsPanel(x, y)
    -- Panel header background - match wireframe #1e3a5f
    love.graphics.setColor(0.118, 0.229, 0.373, 1.0)
    love.graphics.rectangle('fill', x, y, LAYOUT.SIDEBAR_WIDTH, LAYOUT.PANEL_HEADER_HEIGHT)
    
    -- Panel header border
    love.graphics.setColor(0.392, 0.71, 0.965, 1) -- #64b5f6
    love.graphics.rectangle('line', x, y, LAYOUT.SIDEBAR_WIDTH, LAYOUT.PANEL_HEADER_HEIGHT)
    
    -- Panel header text
    love.graphics.setColor(0.91, 0.957, 0.973, 1) -- #e8f4f8
    love.graphics.print("View Controls", x + 12, y + 12)
    
    -- Panel content
    local contentY = y + LAYOUT.PANEL_HEADER_HEIGHT
    local contentHeight = 200
    
    -- Panel content background
    love.graphics.setColor(0.07, 0.125, 0.196, 1.0) -- #122032
    love.graphics.rectangle('fill', x, contentY, LAYOUT.SIDEBAR_WIDTH, contentHeight)
    
    -- Panel content border
    love.graphics.setColor(0.392, 0.71, 0.965, 1) -- #64b5f6
    love.graphics.rectangle('line', x, contentY, LAYOUT.SIDEBAR_WIDTH, contentHeight)
    
    -- View buttons
    local views = {"Top View", "3D View", "North Elevation", "South Elevation", "East Elevation", "West Elevation"}
    local buttonY = contentY + LAYOUT.PANEL_PADDING
    
    for i, view in ipairs(views) do
        local viewKey = self:getViewKey(view)
        local isSelected = self.appState.currentView == viewKey
        local isHovered = self.hoverStates[view]
        
        self:drawViewButton(x + LAYOUT.PANEL_PADDING, buttonY, LAYOUT.SIDEBAR_WIDTH - LAYOUT.PANEL_PADDING * 2, LAYOUT.VIEW_BUTTON_HEIGHT, view, isSelected, isHovered)
        buttonY = buttonY + LAYOUT.VIEW_BUTTON_HEIGHT + 8
    end
    
    -- Height controls separator - moved down to avoid overlapping with view buttons
    local separatorY = buttonY + 20 -- Increased from 12 to 20 for better spacing
    love.graphics.setColor(0.392, 0.71, 0.965, 1) -- #64b5f6
    love.graphics.line(x + LAYOUT.PANEL_PADDING, separatorY, x + LAYOUT.SIDEBAR_WIDTH - LAYOUT.PANEL_PADDING, separatorY)
    
    -- Height display - adjusted position to match new separator
    love.graphics.setColor(0.91, 0.957, 0.973, 1) -- #e8f4f8
    love.graphics.print("Level: " .. self.appState.currentLevel, x + LAYOUT.PANEL_PADDING, separatorY + 20)
    
    -- Height buttons - adjusted position to match new separator
    local heightButtonY = separatorY + 50
    self:drawHeightButton(x + LAYOUT.PANEL_PADDING, heightButtonY, "-", self.hoverStates["heightDown"])
    self:drawHeightButton(x + LAYOUT.PANEL_PADDING + 40, heightButtonY, "+", self.hoverStates["heightUp"])
end

function UIManager:drawViewButton(x, y, width, height, text, isSelected, isHovered)
    -- Button background
    if isSelected then
        love.graphics.setColor(0.392, 0.71, 0.965, 0.3) -- #64b5f6 with 30% transparency
    elseif isHovered then
        love.graphics.setColor(0.392, 0.71, 0.965, 0.1) -- #64b5f6 with 10% transparency
    else
        love.graphics.setColor(0.07, 0.125, 0.196, 1.0) -- #122032
    end
    
    love.graphics.rectangle('fill', x, y, width, height)
    
    -- Button border
    love.graphics.setColor(0.392, 0.71, 0.965, 1) -- #64b5f6
    love.graphics.rectangle('line', x, y, width, height)
    
    -- Button text
    love.graphics.setColor(0.91, 0.957, 0.973, 1) -- #e8f4f8
    local textWidth = love.graphics.getFont():getWidth(text)
    local textX = x + (width - textWidth) / 2
    local textY = y + (height - love.graphics.getFont():getHeight()) / 2
    love.graphics.print(text, textX, textY)
end

function UIManager:drawHeightButton(x, y, symbol, isHovered)
    local size = LAYOUT.HEIGHT_BUTTON_SIZE
    
    -- Button background
    if isHovered then
        love.graphics.setColor(0.392, 0.71, 0.965, 0.1) -- #64b5f6 with 10% transparency
    else
        love.graphics.setColor(0.07, 0.125, 0.196, 1.0) -- #122032
    end
    
    love.graphics.rectangle('fill', x, y, size, size)
    
    -- Button border
    love.graphics.setColor(0.392, 0.71, 0.965, 1) -- #64b5f6
    love.graphics.rectangle('line', x, y, size, size)
    
    -- Button symbol
    love.graphics.setColor(0.91, 0.957, 0.973, 1) -- #e8f4f8
    local textWidth = love.graphics.getFont():getWidth(symbol)
    local textX = x + (size - textWidth) / 2
    local textY = y + (size - love.graphics.getFont():getHeight()) / 2
    love.graphics.print(symbol, textX, textY)
end

function UIManager:drawWorkspaceHeader()
    local y = 0
    local height = LAYOUT.WORKSPACE_HEADER_HEIGHT
    
    -- Header background - match wireframe #1e3a5f
    love.graphics.setColor(0.118, 0.229, 0.373, 1.0)
    love.graphics.rectangle('fill', LAYOUT.SIDEBAR_WIDTH, y, self.viewport.width - LAYOUT.SIDEBAR_WIDTH, height)
    
    -- Header border
    love.graphics.setColor(0.392, 0.71, 0.965, 1) -- #64b5f6
    love.graphics.rectangle('line', LAYOUT.SIDEBAR_WIDTH, y, self.viewport.width - LAYOUT.SIDEBAR_WIDTH, height)
    
    -- Project title - show "Untitled" instead of hardcoded name
    love.graphics.setColor(0.91, 0.957, 0.973, 1) -- #e8f4f8
    love.graphics.print("Untitled", LAYOUT.SIDEBAR_WIDTH + 20, y + 12)
end

function UIManager:drawStatusBar()
    local y = self.viewport.height - LAYOUT.STATUS_BAR_HEIGHT
    local height = LAYOUT.STATUS_BAR_HEIGHT
    
    -- Status bar background - match wireframe #1e3a5f exactly
    love.graphics.setColor(0.118, 0.229, 0.373, 1.0)
    love.graphics.rectangle('fill', 0, y, self.viewport.width, height)
    
    -- Status bar border - match wireframe #64b5f6
    love.graphics.setColor(0.392, 0.71, 0.965, 1)
    love.graphics.rectangle('line', 0, y, self.viewport.width, height)
    
    -- Status text
    love.graphics.setColor(0.91, 0.957, 0.973, 1) -- #e8f4f8
    love.graphics.setFont(love.graphics.getFont())
    
    -- Left status info
    local leftX = 20
    local bounds = self.blockData:getBounds()
    if bounds and self.blockData.hasBlocks then
        love.graphics.print(string.format("X: %d", bounds.minX or 0), leftX, y + 8)
        love.graphics.print(string.format("Y: %d", bounds.minY or 0), leftX + 60, y + 8)
    else
        love.graphics.print("X: 0", leftX, y + 8)
        love.graphics.print("Y: 0", leftX + 60, y + 8)
    end
    love.graphics.print(string.format("Level: %d", self.appState.currentLevel), leftX + 120, y + 8)
    
    -- Right status info - adjusted positioning to ensure visibility
    local rightX = self.viewport.width - 250 -- Increased from 200 to 250 for better spacing
    love.graphics.print(string.format("Blocks: %d", self.blockData:getBlockCount()), rightX, y + 8)
    love.graphics.print("Zoom: 100%", rightX + 80, y + 8)
    love.graphics.print(string.format("Tool: %s", self.appState.activeTool or "None"), rightX + 160, y + 8)
end

function UIManager:updateHoverStates()
    local mouseX = love.mouse.getX()
    local mouseY = love.mouse.getY()
    
    -- Reset all hover states
    for k, _ in pairs(self.hoverStates) do
        self.hoverStates[k] = false
    end
    
    -- Check tool buttons
    local tools = {"place", "erase", "line", "rectangle", "circle", "fill", "measure", "pan", "zoom"}
    local toolY = LAYOUT.WORKSPACE_HEADER_HEIGHT + 5
    local toolSize = 35
    
    -- Define tool groups and their positions (matching the new toolbar layout)
    local toolGroups = {
        {startX = LAYOUT.SIDEBAR_WIDTH + 20, tools = {"place", "erase"}},
        {startX = LAYOUT.SIDEBAR_WIDTH + 115, tools = {"line", "rectangle", "circle", "fill"}},
        {startX = LAYOUT.SIDEBAR_WIDTH + 295, tools = {"measure", "pan", "zoom"}}
    }
    
    for _, group in ipairs(toolGroups) do
        for i, tool in ipairs(group.tools) do
            local tx = group.startX + (i - 1) * (toolSize + 5)
            local ty = toolY
            
            if self:isPointInRect(mouseX, mouseY, tx, ty, toolSize, toolSize) then
                self.hoverStates[tool] = true
            end
        end
    end
    
    -- Check block type buttons
    local blockTypes = {"blockA", "blockB", "blockC", "blockD", "blockE"}
    local cols = 2
    local blockWidth = (LAYOUT.SIDEBAR_WIDTH - LAYOUT.PANEL_PADDING * 2 - LAYOUT.BLOCK_GRID_GAP) / cols
    
    for i, blockType in ipairs(blockTypes) do
        local col = (i - 1) % cols
        local row = math.floor((i - 1) / cols)
        local x = LAYOUT.PANEL_PADDING + col * (blockWidth + LAYOUT.BLOCK_GRID_GAP)
        local y = LAYOUT.PANEL_HEADER_HEIGHT + LAYOUT.PANEL_PADDING + row * (LAYOUT.BLOCK_ITEM_HEIGHT + LAYOUT.BLOCK_GRID_GAP)
        
        if self:isPointInRect(mouseX, mouseY, x, y, blockWidth, LAYOUT.BLOCK_ITEM_HEIGHT) then
            self.hoverStates[blockType] = true
        end
    end
    
    -- Check view buttons
    local views = {"Top View", "3D View", "North Elevation", "South Elevation", "East Elevation", "West Elevation"}
    local blockPanelHeight = LAYOUT.PANEL_HEADER_HEIGHT + 180
    local viewStartY = blockPanelHeight + LAYOUT.PANEL_HEADER_HEIGHT + LAYOUT.PANEL_PADDING
    
    for i, view in ipairs(views) do
        local y = viewStartY + (i - 1) * (LAYOUT.VIEW_BUTTON_HEIGHT + 8)
        local x = LAYOUT.PANEL_PADDING
        local width = LAYOUT.SIDEBAR_WIDTH - LAYOUT.PANEL_PADDING * 2
        
        if self:isPointInRect(mouseX, mouseY, x, y, width, LAYOUT.VIEW_BUTTON_HEIGHT) then
            self.hoverStates[view] = true
        end
    end
    
    -- Check height buttons - use same dynamic positioning as drawing code
    local blockPanelHeight = LAYOUT.PANEL_HEADER_HEIGHT + 180
    local viewStartY = blockPanelHeight + LAYOUT.PANEL_HEADER_HEIGHT + LAYOUT.PANEL_PADDING
    
    -- Calculate buttonY the same way as in drawing code
    local buttonY = viewStartY
    for i = 1, 6 do -- 6 view buttons
        buttonY = buttonY + LAYOUT.VIEW_BUTTON_HEIGHT + 8
    end
    
    local separatorY = buttonY + 20
    local heightButtonY = separatorY + 50
    
    self.hoverStates["heightDown"] = self:isPointInRect(mouseX, mouseY, LAYOUT.PANEL_PADDING, heightButtonY, LAYOUT.HEIGHT_BUTTON_SIZE, LAYOUT.HEIGHT_BUTTON_SIZE)
    self.hoverStates["heightUp"] = self:isPointInRect(mouseX, mouseY, LAYOUT.PANEL_PADDING + 40, heightButtonY, LAYOUT.HEIGHT_BUTTON_SIZE, LAYOUT.HEIGHT_BUTTON_SIZE)
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
        -- Check tool button clicks
        local tools = {"place", "erase", "line", "rectangle", "circle", "fill", "measure", "pan", "zoom"}
        local toolY = LAYOUT.WORKSPACE_HEADER_HEIGHT + 5
        local toolSize = 35
        
        -- Define tool groups and their positions (matching the new toolbar layout)
        local toolGroups = {
            {startX = LAYOUT.SIDEBAR_WIDTH + 20, tools = {"place", "erase"}},
            {startX = LAYOUT.SIDEBAR_WIDTH + 115, tools = {"line", "rectangle", "circle", "fill"}},
            {startX = LAYOUT.SIDEBAR_WIDTH + 295, tools = {"measure", "pan", "zoom"}}
        }
        
        for _, group in ipairs(toolGroups) do
            for i, tool in ipairs(group.tools) do
                local tx = group.startX + (i - 1) * (toolSize + 5)
                local ty = toolY
                
                if self:isPointInRect(x, y, tx, ty, toolSize, toolSize) then
                    self:handleToolClick(tool)
                    return true
                end
            end
        end
        
        -- Check block type clicks
        local blockTypes = {"blockA", "blockB", "blockC", "blockD", "blockE"}
        local cols = 2
        local blockWidth = (LAYOUT.SIDEBAR_WIDTH - LAYOUT.PANEL_PADDING * 2 - LAYOUT.BLOCK_GRID_GAP) / cols
        
        for i, blockType in ipairs(blockTypes) do
            local col = (i - 1) % cols
            local row = math.floor((i - 1) / cols)
            local bx = LAYOUT.PANEL_PADDING + col * (blockWidth + LAYOUT.BLOCK_GRID_GAP)
            local by = LAYOUT.PANEL_HEADER_HEIGHT + LAYOUT.PANEL_PADDING + row * (LAYOUT.BLOCK_ITEM_HEIGHT + LAYOUT.BLOCK_GRID_GAP)
            
            if self:isPointInRect(x, y, bx, by, blockWidth, LAYOUT.BLOCK_ITEM_HEIGHT) then
                self:handleBlockTypeClick(blockType)
                return true
            end
        end
        
        -- Check view control clicks
        local views = {"Top View", "3D View", "North Elevation", "South Elevation", "East Elevation", "West Elevation"}
        local blockPanelHeight = LAYOUT.PANEL_HEADER_HEIGHT + 180
        local viewStartY = blockPanelHeight + LAYOUT.PANEL_HEADER_HEIGHT + LAYOUT.PANEL_PADDING
        
        for i, view in ipairs(views) do
            local vy = viewStartY + (i - 1) * (LAYOUT.VIEW_BUTTON_HEIGHT + 8)
            local vx = LAYOUT.PANEL_PADDING
            local vwidth = LAYOUT.SIDEBAR_WIDTH - LAYOUT.PANEL_PADDING * 2
            
            if self:isPointInRect(x, y, vx, vy, vwidth, LAYOUT.VIEW_BUTTON_HEIGHT) then
                self:handleViewControlClick(view)
                return true
            end
        end
        
        -- Check height control clicks - use same dynamic positioning as drawing code
        local blockPanelHeight = LAYOUT.PANEL_HEADER_HEIGHT + 180
        local viewStartY = blockPanelHeight + LAYOUT.PANEL_HEADER_HEIGHT + LAYOUT.PANEL_PADDING
        
        -- Calculate buttonY the same way as in drawing code
        local buttonY = viewStartY
        for i = 1, 6 do -- 6 view buttons
            buttonY = buttonY + LAYOUT.VIEW_BUTTON_HEIGHT + 8
        end
        
        local separatorY = buttonY + 20
        local heightButtonY = separatorY + 50
        
        if self:isPointInRect(x, y, LAYOUT.PANEL_PADDING, heightButtonY, LAYOUT.HEIGHT_BUTTON_SIZE, LAYOUT.HEIGHT_BUTTON_SIZE) then
            self:handleHeightDownClick()
            return true
        end
        
        if self:isPointInRect(x, y, LAYOUT.PANEL_PADDING + 40, heightButtonY, LAYOUT.HEIGHT_BUTTON_SIZE, LAYOUT.HEIGHT_BUTTON_SIZE) then
            self:handleHeightUpClick()
            return true
        end
    end
    
    return false
end

function UIManager:handleToolClick(tool)
    self.appState:setActiveTool(tool)
    
    -- Also update the ToolManager directly
    if self.toolManager then
        self.toolManager:setCurrentTool(tool)
    end
end

function UIManager:handleBlockTypeClick(blockType)
    self.appState:setSelectedBlockType(blockType)
end

function UIManager:handleViewControlClick(view)
    local viewKey = self:getViewKey(view)
    -- Update both AppState and ViewManager
    self.appState:setCurrentView(viewKey)
    if self.viewManager then
        self.viewManager:setCurrentView(viewKey)
    end
end

function UIManager:handleHeightUpClick()
    local newLevel = math.min(49, self.appState.currentLevel + 1)
    self.appState:setCurrentLevel(newLevel)
end

function UIManager:handleHeightDownClick()
    local newLevel = math.max(0, self.appState.currentLevel - 1)
    self.appState:setCurrentLevel(newLevel)
end

function UIManager:getViewKey(viewName)
    if viewName == "Top View" then
        return "top"
    elseif viewName == "3D View" then
        return "isometric"
    elseif viewName == "North Elevation" then
        return "north"
    elseif viewName == "South Elevation" then
        return "south"
    elseif viewName == "East Elevation" then
        return "east"
    elseif viewName == "West Elevation" then
        return "west"
    end
    return "top" -- Default to top view
end

return UIManager
