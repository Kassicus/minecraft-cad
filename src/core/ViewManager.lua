local ViewManager = {}
ViewManager.__index = ViewManager

function ViewManager:new(viewport, appState, blockData)
    local self = setmetatable({}, ViewManager)
    
    -- Import renderers
    local TopViewRenderer = require('src.rendering.TopViewRenderer')
    local IsometricRenderer = require('src.rendering.IsometricRenderer')
    
    self.renderers = {
        top = TopViewRenderer:new(viewport),
        isometric = IsometricRenderer:new(viewport)
    }
    
    self.currentView = 'top'
    
    return self
end

function ViewManager:getCurrentRenderer()
    return self.renderers[self.currentView]
end

function ViewManager:setCurrentView(viewType)
    self.currentView = viewType
    self:notifyListeners('viewChanged', viewType)
end

function ViewManager:handleResize(width, height)
    for _, renderer in pairs(self.renderers) do
        if renderer.handleResize then
            renderer:handleResize(width, height)
        end
    end
end

return ViewManager
