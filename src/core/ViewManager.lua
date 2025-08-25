local ViewManager = {}
ViewManager.__index = ViewManager

function ViewManager:new(viewport, appState, blockData)
    local self = setmetatable({}, ViewManager)
    
    -- Import renderers
    local TopViewRenderer = require('src.rendering.TopViewRenderer')
    local IsometricRenderer = require('src.rendering.IsometricRenderer')
    local ElevationRenderer = require('src.rendering.ElevationRenderer')
    
    self.renderers = {
        top = TopViewRenderer:new(viewport),
        isometric = IsometricRenderer:new(viewport),
        north = ElevationRenderer:new(viewport, 'north'),
        south = ElevationRenderer:new(viewport, 'south'),
        east = ElevationRenderer:new(viewport, 'east'),
        west = ElevationRenderer:new(viewport, 'west')
    }
    
    self.currentView = 'top'
    self.listeners = {}
    
    -- Listen to AppState changes to stay synchronized
    if appState then
        appState:addListener('viewChanged', function(event, viewType)
            self:setCurrentView(viewType)
        end)
    end
    
    return self
end

function ViewManager:getCurrentRenderer()
    return self.renderers[self.currentView]
end

function ViewManager:setCurrentView(viewType)
    if self.renderers[viewType] then
        self.currentView = viewType
        self:notifyListeners('viewChanged', viewType)
    end
end

function ViewManager:addListener(event, callback)
    if not self.listeners[event] then
        self.listeners[event] = {}
    end
    table.insert(self.listeners[event], callback)
end

function ViewManager:notifyListeners(event, data)
    if self.listeners[event] then
        for _, listener in ipairs(self.listeners[event]) do
            listener(event, data)
        end
    end
end

function ViewManager:handleResize(width, height)
    for _, renderer in pairs(self.renderers) do
        if renderer.handleResize then
            renderer:handleResize(width, height)
        end
    end
end

return ViewManager
