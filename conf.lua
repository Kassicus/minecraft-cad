function love.conf(t)
    t.title = "MinecraftCAD"
    t.version = "11.4"
    t.window.width = 1200
    t.window.height = 800
    t.window.resizable = true
    t.window.minwidth = 800
    t.window.minheight = 600
    
    -- Enable required modules
    t.modules.audio = false
    t.modules.joystick = false
    t.modules.physics = false
    t.modules.sound = false
    t.modules.video = false
end
