local BaseRenderer = {}
BaseRenderer.__index = BaseRenderer

function BaseRenderer.new(viewport)
    print(string.format("BaseRenderer.new called with viewport: %s", tostring(viewport)))
    local o = {}
    setmetatable(o, BaseRenderer)
    o.__index = BaseRenderer
    
    o.viewport = viewport
    o.camera = {
        x = 0,
        y = 0,
        zoom = 1.0
    }
    
    print(string.format("BaseRenderer.new created object with viewport: %s", tostring(o.viewport)))
    return o
end

function BaseRenderer:render(blockData, appState)
    -- Override in subclasses
    error("BaseRenderer:render() must be overridden")
end

function BaseRenderer:worldToScreen(worldX, worldY)
    local screenX = (worldX - self.camera.x) * self.camera.zoom + self.viewport.width / 2
    local screenY = (worldY - self.camera.y) * self.camera.zoom + self.viewport.height / 2
    return screenX, screenY
end

function BaseRenderer:screenToWorld(screenX, screenY)
    local worldX = (screenX - self.viewport.width / 2) / self.camera.zoom + self.camera.x
    local worldY = (screenY - self.viewport.height / 2) / self.camera.zoom + self.camera.y
    return worldX, worldY
end

function BaseRenderer:handleResize(width, height)
    self.viewport.width = width
    self.viewport.height = height
end

return BaseRenderer
