local AppState = {}
AppState.__index = AppState

function AppState:new()
    local self = setmetatable({}, AppState)
    self.currentView = 'top'
    self.currentLevel = 0 -- Ground level (0-49)
    self.activeTool = 'place'
    self.selectedBlockType = 'blockA'
    self.camera = {x = 0, y = 0, zoom = 1.0}
    self.listeners = {}
    return self
end

function AppState:setCurrentView(view)
    self.currentView = view
    self:notifyListeners('viewChanged', view)
end

function AppState:setCurrentLevel(level)
    self.currentLevel = level
    self:notifyListeners('levelChanged', level)
end

function AppState:setActiveTool(tool)
    self.activeTool = tool
    self:notifyListeners('toolChanged', tool)
end

function AppState:setSelectedBlockType(blockType)
    self.selectedBlockType = blockType
    self:notifyListeners('blockTypeChanged', blockType)
end

function AppState:addListener(event, callback)
    if not self.listeners[event] then
        self.listeners[event] = {}
    end
    table.insert(self.listeners[event], callback)
end

function AppState:notifyListeners(event, data)
    if self.listeners[event] then
        for _, listener in ipairs(self.listeners[event]) do
            listener(event, data)
        end
    end
end

return AppState
