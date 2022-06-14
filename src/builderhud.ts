/////////////////////////////////
// BuilderHUD
// (c) 2019 Carl Fravel
// See the Readme for instructions
// Notes: 
// Has the concept of a default par6ent, initially null, but updated by the constructor or any attachToEntity params
// If a new entity is added, it uses the default entity as its parent,
// i.e. the parent specified in the constructor or most recent attachToEnityt call.

import { isPreviewMode } from "@decentraland/EnvironmentAPI"

@Component("moving")
export class Moving {
  direction: string
  mode:string
  pos:number

  constructor(direction: string, mode:string, pos?:number) {
    this.direction = direction
    this.mode = mode
    this.pos = pos ? pos : 0
  }
}

const myGroup = engine.getComponentGroup(Moving)
export class MoveSystem implements ISystem {

    positions:Vector3[] = []

    addCameraPosition(pos:Vector3){
        this.positions.push(pos)
        log(this.positions)
    }

    update() {

      for (let entity of myGroup.entities) {
        const position = entity.getComponent(Transform).position
        const direction = entity.getComponent(Moving).direction
        const mode = entity.getComponent(Moving).mode

        switch(mode){
            case "fixed":
                var pos = entity.getComponent(Transform).position.clone()
                var point = entity.getComponent(Moving).pos
                if(!(Vector3.Distance(pos, this.positions[point]) < .05)){
                    entity.getComponent(Transform).position = Vector3.Lerp(pos,this.positions[point], .04)
                }
                else{
                    entity.removeComponent(Moving)
                }
                break;

            case "free":
                if(direction == "up"){
                    if(position.y < 150){
                      position.y += .1
                      //this.axis.getComponent(Transform).position.y += .1
                    }
                  }
            
                  if(direction == "down"){
                    if(position.y > .2){
                      position.y -= .1
                      //this.axis.getComponent(Transform).position.y -= .1
                    }
                    else{
                        entity.removeComponent(Moving)
                    }
                  }
                  if(direction== "forward"){
                    //if(position.x > 3 && position.x < 30 && position.y > 2){
                      position.z += .1
                   // }
                  }
              
                  if(direction == "back"){
                    if(position.z > 1){
                      position.z -= .1
                    }
                    else{
                      entity.removeComponent(Moving)
                    }
                  }
                  if(direction == "right"){
                      position.x += .1
                  }
                  if(direction == "left"){
                    if(position.x > 1){
                      position.x -= .1
                    }
                    else{
                      entity.removeComponent(Moving)
                    }
                  }
                break;
        }
      }
      
    }
  }

// TODO xyz widget needs to always be rotated 180.  Maybe it is rotated 180 within a parent?  how does it come out in Dump?



class BuilderHUD {
    isSetup: boolean = false
    defaultParent:any
    entities:{entity: Entity, transform:Transform, preexisting:boolean}[] = []
    numEntities:number = 0
    selectedEntityIndex:number = -1 // index into this.entities of selected entity.  -1 means none yet selected.
    rotator:any

    selectionPointer:any
    selectionPointerScale:number=1
    selectionPointerElevation:number = 1 // how much the selection pointer is raised relative to the root of the selected object.
                                         // TODO provide a means to adjust its elevation, or to determine top of object and put it above that.
    newEntityShape:any
    newEntityScale:number = 0.1

    modePOSITION:number=0
    modeROTATION:number=1
    modeSCALE:number=2
    mode:number = this.modePOSITION

    snap:number = 0
    snapPosScale:number = 1
    snapRot:number = 90

    canvas:any
    uiMinimizedContainer: any
    uiMaximizedContainer: any
    uiMaximized:boolean = false

    maximizeButton:any

    displayName:any
    displayPRS:any
    scaffoldTitle:any

    qButton:any
    wButton:any
    eButton:any

    aButton:any
    sButton:any
    dButton:any

    modeButton:any
    modeLabel:any
    snapButton:any
    snapLabel:any

    selectPreviousButton:any
    selectNextButton:any
    discardItemButton:any

    newEntitytButtonButton:any
    saveButton:any
    minimizeButton:any

    engineEntities:Entity[] = []

    pendingEntityAdd:any

    scaffolding:Entity

    scaffoldU:any
    scaffoldD:any
    scaffoldL:any
    scaffoldR:any
    scaffoldF:any
    scaffoldB:any
    toggleLift:any
    toggleCamera:any

    scaffloor:Entity
    showingColliders: boolean = false

    //axis:Entity

    leftWall:Entity
    rightWall:Entity
    frontWall:Entity
    backWall:Entity
    transparent = new Texture("https://lsnft.mypinata.cloud/ipfs/QmaqcRuouE6Tip9acZmjxMyBftEA5aHASRDjn8Bmad87Ld")
    scaffoldScale = new Vector3(1.2,1,1.2)

    movingSystem:MoveSystem

    transparentMat: BasicMaterial
    unsavedContainer:UIContainerRect

    constructor () {

        this.transparentMat = new BasicMaterial()
        this.transparentMat.alphaTest = 1
        this.transparentMat.texture = this.transparent



        this.scaffolding = new Entity()
        this.scaffolding.addComponent(new Transform({
            position: new Vector3(1,.3,1),
            scale: Vector3.Zero()
        }))
        engine.addEntity(this.scaffolding)

        let axis = new Entity()
        axis.addComponent(new Transform({
            position: new Vector3(-.5,1,-.5),
            scale: Vector3.One()
        }))
        axis.setParent(this.scaffolding)

        var xaxis = new Entity()
        xaxis.addComponent(new BoxShape())
        xaxis.addComponent(new Transform({
            position: new Vector3(2,0,.1),
            scale: new Vector3(4,.1,.1)
        }))
        xaxis.setParent(axis)
        xaxis.getComponent(BoxShape).withCollisions = false
        xaxis.addComponent(new Material())
        xaxis.getComponent(Material).albedoColor = Color4.Red()

        var xaxisText = new Entity()
        xaxisText.addComponent(new TextShape("X"))
        xaxisText.addComponent(new Transform({
            position: new Vector3(3,.5,.4)
        }))
        xaxisText.addComponent(new Billboard(false,true,false))
        xaxisText.setParent(axis)

        var yaxis = new Entity()
        yaxis.addComponent(new BoxShape())
        yaxis.addComponent(new Transform({
            position: new Vector3(.1,2,.1),
            scale: new Vector3(.1,4,.1)
        }))
        yaxis.setParent(axis)
        yaxis.getComponent(BoxShape).withCollisions = false
        yaxis.addComponent(new Material())
        yaxis.getComponent(Material).albedoColor = Color4.Green()

        var yaxisText = new Entity()
        yaxisText.addComponent(new TextShape("Y"))
        yaxisText.addComponent(new Transform({
            position: new Vector3(.5,3,.5)
        }))
        yaxisText.addComponent(new Billboard(false,true,false))
        yaxisText.setParent(axis)

        var zaxis = new Entity()
        zaxis.addComponent(new BoxShape())
        zaxis.addComponent(new Transform({
            position: new Vector3(.1,0,2),
            scale: new Vector3(.1,.1,4)
        }))
        zaxis.setParent(axis)
        zaxis.addComponent(new Material())
        zaxis.getComponent(BoxShape).withCollisions = false
        zaxis.getComponent(Material).albedoColor = Color4.Blue()

        var zaxisText = new Entity()
        zaxisText.addComponent(new TextShape("Z"))
        zaxisText.addComponent(new Transform({
            position: new Vector3(.4,1,4)
        }))
        zaxisText.addComponent(new Billboard(false,true,false))
        zaxisText.setParent(axis)

        this.scaffloor = new Entity()
        this.scaffloor.addComponent(new PlaneShape()) 
        this.scaffloor.addComponent(new Transform({
            position: new Vector3(0,0,0),
            rotation: Quaternion.Euler(90,0,0),
            scale: Vector3.One()
        }))
        this.scaffloor.addComponent(new Material())
        engine.addEntity(this.scaffloor)
        this.scaffloor.setParent(this.scaffolding)

        this.leftWall = new Entity()
        this.leftWall.addComponent(new PlaneShape())
        this.leftWall.addComponent(new Transform({
            position: new Vector3(0,-4.5,.6),
            rotation: Quaternion.Euler(0,180,0),
            scale: Vector3.Zero()
        }))
        this.leftWall.addComponent(this.transparentMat)
        //engine.addEntity(this.leftWall)
        this.leftWall.setParent(this.scaffolding)

        this.rightWall = new Entity()
        this.rightWall.addComponent(new PlaneShape())
        this.rightWall.addComponent(new Transform({
            position: new Vector3(0,-4.5,-.6),
            rotation: Quaternion.Euler(0,180,0),
            scale: Vector3.Zero()
        }))
        //engine.addEntity(this.rightWall)
        this.rightWall.addComponent(this.transparentMat)
        this.rightWall.setParent(this.scaffolding)

        this.frontWall = new Entity()
        this.frontWall.addComponent(new PlaneShape())
        this.frontWall.addComponent(new Transform({
            position: new Vector3(0.6,-4.5,0),
            rotation: Quaternion.Euler(0,270,0),
            scale: Vector3.Zero()
        }))
        //engine.addEntity(this.frontWall)
        this.frontWall.addComponent(this.transparentMat)
        this.frontWall.setParent(this.scaffolding)

        this.backWall = new Entity()
        this.backWall.addComponent(new PlaneShape())
        this.backWall.addComponent(new Transform({
            position: new Vector3(-0.6,-4.5,0),
            rotation: Quaternion.Euler(0,270,0),
            scale: Vector3.One()
        }))
        //engine.addEntity(this.backWall)
        this.backWall.addComponent(this.transparentMat)
        this.backWall.setParent(this.scaffolding)


        this.selectionPointer = new Entity()
        this.selectionPointer.addComponent(new PlaneShape())
        this.selectionPointer.getComponent(PlaneShape).withCollisions = false
        this.selectionPointer.addComponent(new BasicMaterial())
        this.selectionPointer.getComponent(BasicMaterial).texture = new Texture("https://lsnft.mypinata.cloud/ipfs/QmWbKQtJjsLjgDFinoH6fvmbUoetLZd7LanChC1R4QkA2e")
        //this.selectionPointer.getComponent(BasicMaterial).alphaTest = 1
        this.selectionPointer.addComponent(new Transform({rotation: Quaternion.Euler(0,0,180), scale: Vector3.One()}))
        this.selectionPointer.addComponent(new Billboard(false,true,false))

        this.setupUI()
        executeTask(async ()=>{
            if(await isPreviewMode()){
                log("in preview mode")
                hud.uiMinimizedContainer.visible = true
            }
            else{
                log("not in preview mode")
              hud.uiMinimizedContainer.visible =false
              hud.uiMaximizedContainer.visible = false
              engine.removeEntity(this.selectionPointer)
            }
        })


        this.unsavedContainer = new UIContainerRect(this.uiMaximizedContainer)
        this.unsavedContainer.hAlign = 'center'
        this.unsavedContainer.vAlign = 'center'
        this.unsavedContainer.width = 160
        this.unsavedContainer.height = 20
        this.unsavedContainer.positionY = 225

        this.unsavedContainer.positionX = 0
        this.unsavedContainer.color = Color4.Red()
        this.unsavedContainer.visible = false


        var changes = new UIText(this.unsavedContainer)
        changes.hAlign = 'center'
        changes.vAlign = 'center'
        changes.positionY = 0
        changes.positionX = 0
        changes.height = 10
        changes.fontSize = 12
        changes.hTextAlign = "center"
        changes.value = "** Unsaved Changes **"

        //engine.addSystem(new MoveSystem(this.scaffolding, this.axis))
        this.movingSystem = new MoveSystem()
        engine.addSystem(this.movingSystem)
    }

    setDefaultParent(defaultParent:Entity) {
        this.defaultParent = defaultParent
    }

    async setupUI (){
        this.isSetup = true
        // load the image atlas
        let imageAtlas = "https://lsnft.mypinata.cloud/ipfs/QmYyDWc67svskJWxQrZNJxjwNsvsXyG9dvVzXvJtYtmgAr"
        let imageTexture = new Texture(imageAtlas)

        // Create canvas component
        this.canvas = new UICanvas()
        this.canvas.hAlign = 'center'
        this.canvas.vAlign = 'bottom'
        //this.canvas.positionY = 100
        //this.canvas.positionX = 10
        
        //////////////////////// 
        // Minimized UI
        // Container
        this.uiMinimizedContainer = new UIContainerRect(this.canvas)
        this.uiMinimizedContainer.hAlign = 'right'
        this.uiMinimizedContainer.vAlign = 'bottom'
        //this.uiMinimizedContainer.adaptHeight = true
        //this.uiMinimizedContainer.adaptWidth = true
        this.uiMinimizedContainer.width = 70
        this.uiMinimizedContainer.height = 80
        this.uiMinimizedContainer.positionY = 100
        this.uiMinimizedContainer.positionX = 0
        this.uiMinimizedContainer.color = new Color4(0, 0, 0, 0)
        //this.uiMinimizedContainer.stackOrientation = UIStackOrientation.VERTICAL
        this.uiMinimizedContainer.visible = false

        // Expand button
        this.maximizeButton = new UIImage(this.uiMinimizedContainer, imageTexture)
        this.maximizeButton.sourceLeft = 826
        this.maximizeButton.sourceTop = 544
        this.maximizeButton.sourceWidth = 74
        this.maximizeButton.sourceHeight = 74
        //this.maximizeButton.hAlign = 'left'
        //this.maximizeButton.vAlign = 'top'
        //this.maximizeButton.positionX = 5
        //this.maximizeButton.positionY = -5
        this.maximizeButton.hAlign = 'right'
        this.maximizeButton.vAlign = 'bottom'
        this.maximizeButton.positionX = -15
        this.maximizeButton.positionY = 30
        this.maximizeButton.width=40
        this.maximizeButton.height=40
        this.maximizeButton.isPointerBlocker = true
        this.maximizeButton.onClick = new OnClick(() => {
            this.maximizeUI()
        })

        //////////////////////// 
        // Maximized UI
        ///////////////////////

        // Container       
        this.uiMaximizedContainer = new UIContainerRect(this.canvas)
        this.uiMaximizedContainer.hAlign = 'right'
        this.uiMaximizedContainer.vAlign = 'bottom'
        //this.uiMaximizedContainer.adaptWidth = true
        //this.uiMaximizedContainer.adaptHeight = true
        this.uiMaximizedContainer.width = 160
        this.uiMaximizedContainer.height = 430
        this.uiMaximizedContainer.positionX = 0
        this.uiMaximizedContainer.positionY = 100
        this.uiMaximizedContainer.color = new Color4(0, 0, 0, 0.75)
        //this.uiMaximizedContainer.stackOrientation = UIStackOrientation.VERTICAL

        var returnHome = new UIImage(this.uiMaximizedContainer, imageTexture)
        returnHome.sourceLeft = 826
        returnHome.sourceTop = 184
        returnHome.sourceWidth = 74
        returnHome.sourceHeight = 74
        returnHome.hAlign = 'right'
        returnHome.vAlign = 'top'
        returnHome.positionX = -60
        returnHome.positionY = -10
        returnHome.width=40
        returnHome.height=40
        returnHome.isPointerBlocker = true
        
        returnHome.onClick = new OnClick(() => {
            this.toggleLift.sourceLeft = 503
            this.toggleColliders(true)
            engine.addSystem(new ClickAnimationSystem(returnHome))
        })
        

        this.toggleLift = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.toggleLift.sourceLeft = 584
        this.toggleLift.sourceTop = 544
        this.toggleLift.sourceWidth = 74
        this.toggleLift.sourceHeight = 74
        this.toggleLift.hAlign = 'right'
        this.toggleLift.vAlign = 'top'
        this.toggleLift.positionX = -15
        this.toggleLift.positionY = -10
        this.toggleLift.width=40
        this.toggleLift.height=40
        this.toggleLift.isPointerBlocker = true
        this.toggleLift.onClick = new OnClick(() => {
            this.toggleColliders(false)
            engine.addSystem(new ClickAnimationSystem(this.toggleLift))
        })

        this.toggleCamera = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.toggleCamera.sourceLeft = 16
        this.toggleCamera.sourceTop = 94
        this.toggleCamera.sourceWidth = 74
        this.toggleCamera.sourceHeight = 74
        this.toggleCamera.hAlign = 'right'
        this.toggleCamera.vAlign = 'top'
        this.toggleCamera.positionX = -105
        this.toggleCamera.positionY = -10
        this.toggleCamera.width=40
        this.toggleCamera.height=40
        this.toggleCamera.isPointerBlocker = true
        this.toggleCamera.onClick = new OnClick(() => {
            this.toggleCameraOptions()
            engine.addSystem(new ClickAnimationSystem(this.toggleCamera))
        })
        this.toggleCamera.visible = false

        // ROW 1
        // q button -z pos,scale; -z rot
        this.scaffoldB = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.scaffoldB.sourceLeft = 340
        this.scaffoldB.sourceTop = 544
        this.scaffoldB.sourceWidth = 74
        this.scaffoldB.sourceHeight = 74
        this.scaffoldB.hAlign = 'right'
        this.scaffoldB.vAlign = 'bottom'
        this.scaffoldB.positionX = -105
        this.scaffoldB.positionY = 335
        this.scaffoldB.width=40
        this.scaffoldB.height=40
        this.scaffoldB.isPointerBlocker = true
        this.scaffoldB.onClick = new OnClick(() => {
            this.moveScaffold("q")
            engine.addSystem(new ClickAnimationSystem(this.scaffoldB))
        })

        // w button  +y pos,scale; -x rot
        this.scaffoldU = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.scaffoldU.sourceLeft = 178
        this.scaffoldU.sourceTop = 544
        this.scaffoldU.sourceWidth = 74
        this.scaffoldU.sourceHeight = 74
        this.scaffoldU.hAlign = 'right'
        this.scaffoldU.vAlign = 'bottom'
        this.scaffoldU.positionX = -60
        this.scaffoldU.positionY = 335
        this.scaffoldU.width=40
        this.scaffoldU.height=40 
        this.scaffoldU.isPointerBlocker = true
        this.scaffoldU.onClick = new OnClick(() => {
            this.moveScaffold("w")
            engine.addSystem(new ClickAnimationSystem(this.scaffoldU))
        })

        // e button  +z pos,scale; +y rot
        this.scaffoldF = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.scaffoldF.sourceLeft = 422
        this.scaffoldF.sourceTop = 544
        this.scaffoldF.sourceWidth = 74
        this.scaffoldF.sourceHeight = 74
        this.scaffoldF.hAlign = 'right'
        this.scaffoldF.vAlign = 'bottom'
        this.scaffoldF.positionX = -15
        this.scaffoldF.positionY = 335
        this.scaffoldF.width=40
        this.scaffoldF.height=40
        this.scaffoldF.isPointerBlocker = true
        this.scaffoldF.onClick = new OnClick(() => {
            this.moveScaffold("e")
            engine.addSystem(new ClickAnimationSystem(this.scaffoldF))
        })

                // ROW 2
        // a button -x pos,scale; +y rot
        this.scaffoldL = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.scaffoldL.sourceLeft = 16
        this.scaffoldL.sourceTop = 544
        this.scaffoldL.sourceWidth = 74
        this.scaffoldL.sourceHeight = 74
        this.scaffoldL.hAlign = 'right'
        this.scaffoldL.vAlign = 'bottom'
        this.scaffoldL.positionX = -105
        this.scaffoldL.positionY = 290
        this.scaffoldL.width=40
        this.scaffoldL.height=40
        this.scaffoldL.isPointerBlocker = true
        this.scaffoldL.onClick = new OnClick(() => {
            this.moveScaffold("a")
            engine.addSystem(new ClickAnimationSystem(this.scaffoldL))
        })

        // S button  -y pos,scale; +x rot
        this.scaffoldD = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.scaffoldD.sourceLeft = 259
        this.scaffoldD.sourceTop = 544
        this.scaffoldD.sourceWidth = 74
        this.scaffoldD.sourceHeight = 74
        this.scaffoldD.hAlign = 'right'
        this.scaffoldD.vAlign = 'bottom'
        this.scaffoldD.positionX = -60
        this.scaffoldD.positionY = 290
        this.scaffoldD.width=40
        this.scaffoldD.height=40 
        this.scaffoldD.isPointerBlocker = true
        this.scaffoldD.onClick = new OnClick(() => {
            this.moveScaffold("s")
            engine.addSystem(new ClickAnimationSystem(this.scaffoldD))
        })

        // d button  +x pos,scale; -y rot
        this.scaffoldR = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.scaffoldR.sourceLeft = 97
        this.scaffoldR.sourceTop = 544
        this.scaffoldR.sourceWidth = 74
        this.scaffoldR.sourceHeight = 74
        this.scaffoldR.hAlign = 'right'
        this.scaffoldR.vAlign = 'bottom'
        this.scaffoldR.positionX = -15
        this.scaffoldR.positionY = 290
        this.scaffoldR.width=40
        this.scaffoldR.height=40
        this.scaffoldR.isPointerBlocker = true
        this.scaffoldR.onClick = new OnClick(() => {
            this.moveScaffold("d")
            engine.addSystem(new ClickAnimationSystem(this.scaffoldR))
        })


        this.displayName = new UIText(this.uiMaximizedContainer)
        this.displayName.hAlign = 'center'
        this.displayName.vAlign = 'top'
        this.displayName.positionY = -180
        this.displayName.positionX = 0
        this.displayName.height = 10
        this.displayName.fontSize = 12
        this.displayName.hTextAlign = "center"

        let entityLabel = new UIText(this.uiMaximizedContainer)
         entityLabel.hAlign = 'center'
         entityLabel.vAlign = 'top'
         entityLabel.positionY = -160
         entityLabel.positionX = 0
         entityLabel.height = 10
         entityLabel.fontSize = 12
         entityLabel.hTextAlign = "center"
         entityLabel.value = "Entity Label"

        this.displayPRS = new UIText(this.uiMaximizedContainer)
        this.displayPRS.hAlign = 'center'
        this.displayPRS.vAlign = 'top'
        this.displayPRS.positionY = -200
        this.displayPRS.positionX = 0
        this.displayPRS.height = 10
        this.displayPRS.fontSize = 12
        this.displayPRS.hTextAlign = "center"
        this.displayPRS.value = "(0,0,0)"

        this.scaffoldTitle = new UIText(this.uiMaximizedContainer)
        this.scaffoldTitle.hAlign = 'center'
        this.scaffoldTitle.vAlign = 'top'
        this.scaffoldTitle.positionY = -25
        this.scaffoldTitle.positionX = -45
        this.scaffoldTitle.height = 10
        this.scaffoldTitle.fontSize = 8
        this.scaffoldTitle.hTextAlign = "center"
        this.scaffoldTitle.value = "Scaffold"


        // ROW 3
        // Select Previous button
        this.selectPreviousButton = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.selectPreviousButton.sourceLeft = 16
        this.selectPreviousButton.sourceTop = 184
        this.selectPreviousButton.sourceWidth = 74
        this.selectPreviousButton.sourceHeight = 74
        this.selectPreviousButton.hAlign = 'right'
        this.selectPreviousButton.vAlign = 'bottom'
        this.selectPreviousButton.positionX = -105
        this.selectPreviousButton.positionY = 30
        this.selectPreviousButton.width=40
        this.selectPreviousButton.height=40
        this.selectPreviousButton.isPointerBlocker = true
        this.selectPreviousButton.onClick = new OnClick(() => {
            this.selectPrevious()
            engine.addSystem(new ClickAnimationSystem(this.selectPreviousButton))
        })

        // Select Next button
        this.selectNextButton = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.selectNextButton.sourceLeft = 97
        this.selectNextButton.sourceTop = 184
        this.selectNextButton.sourceWidth = 74
        this.selectNextButton.sourceHeight = 74
        this.selectNextButton.hAlign = 'right'
        this.selectNextButton.vAlign = 'bottom'
        this.selectNextButton.positionX = -60
        this.selectNextButton.positionY = 30
        this.selectNextButton.width=40
        this.selectNextButton.height=40 
        this.selectNextButton.isPointerBlocker = true
        this.selectNextButton.onClick = new OnClick(() => {
            this.selectNext()
            engine.addSystem(new ClickAnimationSystem(this.selectNextButton))
        })

        // Save button
        this.saveButton = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.saveButton.sourceLeft = 745
        this.saveButton.sourceTop = 184
        this.saveButton.sourceWidth = 74
        this.saveButton.sourceHeight = 74
        this.saveButton.hAlign = 'right'
        this.saveButton.vAlign = 'bottom'
        this.saveButton.positionX = -15
        this.saveButton.positionY = 75
        this.saveButton.width=40
        this.saveButton.height=40
        this.saveButton.isPointerBlocker = true
        this.saveButton.onClick = new OnClick(() => {
            this.dump()
            engine.addSystem(new ClickAnimationSystem(this.saveButton))
        })


        // ROW 1
        // q button -z pos,scale; -z rot
        this.qButton = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.qButton.sourceLeft = 340
        this.qButton.sourceTop = 544
        this.qButton.sourceWidth = 74
        this.qButton.sourceHeight = 74
        this.qButton.hAlign = 'right'
        this.qButton.vAlign = 'bottom'
        this.qButton.positionX = -105
        this.qButton.positionY = 165
        this.qButton.width=40
        this.qButton.height=40
        this.qButton.isPointerBlocker = true
        this.qButton.onClick = new OnClick((e) => {
            this.adjustTransform("q")
            engine.addSystem(new ClickAnimationSystem(this.qButton))
        })

        // w button  +y pos,scale; -x rot
        this.wButton = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.wButton.sourceLeft = 178
        this.wButton.sourceTop = 544
        this.wButton.sourceWidth = 74
        this.wButton.sourceHeight = 74
        this.wButton.hAlign = 'right'
        this.wButton.vAlign = 'bottom'
        this.wButton.positionX = -60
        this.wButton.positionY = 165
        this.wButton.width=40
        this.wButton.height=40 
        this.wButton.isPointerBlocker = true
        this.wButton.onClick = new OnClick(() => {
            this.adjustTransform("w")
            engine.addSystem(new ClickAnimationSystem(this.wButton))
        })

        // e button  +z pos,scale; +y rot
        this.eButton = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.eButton.sourceLeft = 422
        this.eButton.sourceTop = 544
        this.eButton.sourceWidth = 74
        this.eButton.sourceHeight = 74
        this.eButton.hAlign = 'right'
        this.eButton.vAlign = 'bottom'
        this.eButton.positionX = -15
        this.eButton.positionY = 165
        this.eButton.width=40
        this.eButton.height=40
        this.eButton.isPointerBlocker = true
        this.eButton.onClick = new OnClick(() => {
            this.adjustTransform("e")
            engine.addSystem(new ClickAnimationSystem(this.eButton))
        })

        // ROW 2
        // a button -x pos,scale; +y rot
        this.aButton = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.aButton.sourceLeft = 16
        this.aButton.sourceTop = 544
        this.aButton.sourceWidth = 74
        this.aButton.sourceHeight = 74
        this.aButton.hAlign = 'right'
        this.aButton.vAlign = 'bottom'
        this.aButton.positionX = -105
        this.aButton.positionY = 120
        this.aButton.width=40
        this.aButton.height=40
        this.aButton.isPointerBlocker = true
        this.aButton.onClick = new OnClick(() => {
            this.adjustTransform("a")
            engine.addSystem(new ClickAnimationSystem(this.aButton))
        })

        // S button  -y pos,scale; +x rot
        this.sButton = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.sButton.sourceLeft = 259
        this.sButton.sourceTop = 544
        this.sButton.sourceWidth = 74
        this.sButton.sourceHeight = 74
        this.sButton.hAlign = 'right'
        this.sButton.vAlign = 'bottom'
        this.sButton.positionX = -60
        this.sButton.positionY = 120
        this.sButton.width=40
        this.sButton.height=40 
        this.sButton.isPointerBlocker = true
        this.sButton.onClick = new OnClick(() => {
            this.adjustTransform("s")
            engine.addSystem(new ClickAnimationSystem(this.sButton))
        })

        // d button  +x pos,scale; -y rot
        this.dButton = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.dButton.sourceLeft = 97
        this.dButton.sourceTop = 544
        this.dButton.sourceWidth = 74
        this.dButton.sourceHeight = 74
        this.dButton.hAlign = 'right'
        this.dButton.vAlign = 'bottom'
        this.dButton.positionX = -15
        this.dButton.positionY = 120
        this.dButton.width=40
        this.dButton.height=40
        this.dButton.isPointerBlocker = true
        this.dButton.onClick = new OnClick(() => {
            this.adjustTransform("d")
            engine.addSystem(new ClickAnimationSystem(this.dButton))
        })


        // ROW 2.5 
        // Mode Button
        this.modeButton = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.modeButton.sourceLeft = 259
        this.modeButton.sourceTop = 94
        this.modeButton.sourceWidth = 74
        this.modeButton.sourceHeight = 74
        this.modeButton.hAlign = 'right'
        this.modeButton.vAlign = 'bottom'
        this.modeButton.positionX = -105
        this.modeButton.positionY = 75
        this.modeButton.width=40
        this.modeButton.height=40 
        this.modeButton.isPointerBlocker = true
        this.modeButton.onClick = new OnClick(() => {
            this.mode += 1
            if (this.mode>this.modeSCALE)
                this.mode = this.modePOSITION
            this.snap = 0
            this.setSnaps()
            this.applyModeAndSnapLabels()
            engine.addSystem(new ClickAnimationSystem(this.modeButton))
        })

        this.modeLabel = new UIText(this.modeButton)
        this.modeLabel.color = Color4.White()
        this.modeLabel.hAlign = 'center'
        this.modeLabel.vAlign = 'bottom'
        this.modeLabel.paddingTop = 0
        this.modeLabel.paddingBottom = 12
        this.modeLabel.positionX = -30
        this.modeLabel.paddingLeft = 0
        this.modeLabel.fontSize = 12
        this.modeLabel.fontWeight = 'bold'
        this.modeLabel.isPointerBlocker = false
        this.modeLabel.hTextAlign = 'center'

        // snap Button
        this.snapButton = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.snapButton.sourceLeft = 259
        this.snapButton.sourceTop = 93
        this.snapButton.sourceWidth = 74
        this.snapButton.sourceHeight = 74
        this.snapButton.hAlign = 'right'
        this.snapButton.vAlign = 'bottom'
        this.snapButton.positionX = - 60
        this.snapButton.positionY = 75
        this.snapButton.width=40
        this.snapButton.height=40 
        this.snapButton.isPointerBlocker = true
        this.snapButton.onClick = new OnClick(() => {
            this.snap += 1
            if (this.snap > 3)
                this.snap = 0
            this.setSnaps()
            this.applyModeAndSnapLabels()
            engine.addSystem(new ClickAnimationSystem(this.snapButton))
        })

        this.snapLabel = new UIText(this.snapButton)
        this.snapLabel.color = Color4.White()
        this.snapLabel.hAlign = 'right'
        this.snapLabel.vAlign = 'bottom'
        this.snapLabel.positionX = - 30
        this.snapLabel.paddingTop = 0
        this.snapLabel.paddingBottom = 12
        this.snapLabel.paddingLeft = 0
        this.snapLabel.fontSize = 12
        this.snapLabel.fontWeight = 'bold'
        this.snapLabel.hTextAlign = "center"
        this.snapLabel.isPointerBlocker = false

        // call this during setup to get the mode and snap buttons labelled initially
        this.applyModeAndSnapLabels(true)



        // Minimize> button
        this.minimizeButton = new UIImage(this.uiMaximizedContainer, imageTexture)
        this.minimizeButton.sourceLeft = 908
        this.minimizeButton.sourceTop = 544
        this.minimizeButton.sourceWidth = 74
        this.minimizeButton.sourceHeight = 74
        this.minimizeButton.hAlign = 'right'
        this.minimizeButton.vAlign = 'bottom'
        this.minimizeButton.positionX = -15
        this.minimizeButton.positionY = 30
        this.minimizeButton.width=40
        this.minimizeButton.height=40
        this.minimizeButton.isPointerBlocker = true
        this.minimizeButton.onClick = new OnClick(() => {
             this.minimizeUI()
             engine.addSystem(new ClickAnimationSystem(this.minimizeButton))
        })

        // ROW 5
        // HUD Caption
        const maximizedLabel = new UIText(this.uiMaximizedContainer)
        maximizedLabel.value = 'Builder HUD'
        maximizedLabel.color = Color4.White()
        maximizedLabel.hAlign = 'center'
        maximizedLabel.vAlign = 'bottom'
        maximizedLabel.paddingTop = 0
        maximizedLabel.paddingBottom = 5
        maximizedLabel.paddingLeft = 15
        maximizedLabel.fontSize = 12
        //maximizedLabel.fontWeight = 'bold'
        maximizedLabel.isPointerBlocker = false

        // Now that it is all set up, minimize it
        this.minimizeUI()
    }

    setSnaps() {
        switch (this.snap) {
            case 0:
                this.snapPosScale = 1
                this.snapRot = 90
                break
            case 1:
                this.snapPosScale = 0.1
                this.snapRot = 15
                break
            case 2:
                this.snapPosScale = 0.01
                this.snapRot = 5
                break
            case 3:
                this.snapPosScale = 0.001
                this.snapRot = 1
                break
        }
    }
    applyModeAndSnapLabels(init?:boolean){
        // Put the edit mode onto the button's label
        switch (this.mode) {
            case this.modePOSITION:
                    this.modeLabel.value = "P"
                break
            case this.modeROTATION:
                    this.modeLabel.value = "R"
                break
            case this.modeSCALE:
                    this.modeLabel.value = "S"
                break
            default:
                    this.modeLabel.value="ERR"
                    
        }  
        init ? null : this.updateDisplayPRS()

        switch (this.snap){
            case 0:
                if (this.mode == this.modeROTATION){
                    this.snapLabel.value = "90"
                }
                else {
                    this.snapLabel.value = "1"
                }
                break
            case 1:
                    if (this.mode == this.modeROTATION){
                        this.snapLabel.value = "15"
                    }
                    else {
                        this.snapLabel.value = "0.1"
                    }
                    break
            case 2:
                    if (this.mode == this.modeROTATION){
                        this.snapLabel.value = "5"
                    }
                    else {
                        this.snapLabel.value = "0.01"
                    }
                    break
            case 3:
                    if (this.mode == this.modeROTATION){
                        this.snapLabel.value = "1"
                    }
                    else {
                        this.snapLabel.value = "0.001"
                    }
                    break
            default:
                    this.snapLabel.value="ERR"
                                
        }
    }

    countDecimals(num:number) {
        if(Math.floor(num) === num) return 0;
        return num.toString().split(".")[1].length || 0; 
    }

    updateDisplayPRS(){
        switch(this.mode){
            case this.modePOSITION:
                this.displayPRS.value = "POS: (" + this.entities[this.selectedEntityIndex].entity.getComponent(Transform).position.x.toFixed(this.countDecimals(this.snapPosScale)) + "," + this.entities[this.selectedEntityIndex].entity.getComponent(Transform).position.y.toFixed(this.countDecimals(this.snapPosScale)) + "," + this.entities[this.selectedEntityIndex].entity.getComponent(Transform).position.z.toFixed(this.countDecimals(this.snapPosScale)) + ")"
                break;

            case this.modeROTATION:
                this.displayPRS.value = "ROT: (" + Math.ceil(this.entities[this.selectedEntityIndex].entity.getComponent(Transform).rotation.eulerAngles.x) + "," + Math.ceil(this.entities[this.selectedEntityIndex].entity.getComponent(Transform).rotation.eulerAngles.y) + "," + Math.ceil(this.entities[this.selectedEntityIndex].entity.getComponent(Transform).rotation.eulerAngles.z) + ")"
                break;

            case this.modeSCALE:
                this.displayPRS.value = "SCL: (" + this.entities[this.selectedEntityIndex].entity.getComponent(Transform).scale.x.toFixed(this.countDecimals(this.snapPosScale)) + "," + this.entities[this.selectedEntityIndex].entity.getComponent(Transform).scale.y.toFixed(this.countDecimals(this.snapPosScale)) + "," + this.entities[this.selectedEntityIndex].entity.getComponent(Transform).scale.z.toFixed(this.countDecimals(this.snapPosScale)) + ")"
                break;
        }
    }

    maximizeUI(){
        this.uiMinimizedContainer.visible = false
        this.uiMaximizedContainer.visible = true
        this.uiMaximized = true
        if (this.selectedEntityIndex >=0 && this.numEntities >0) {
            engine.addEntity(this.selectionPointer)
        }
        this.mode=this.modePOSITION
        this.applyModeAndSnapLabels()
        this.displayName.value = this.entities[this.selectedEntityIndex].entity.name
        this.updateDisplayPRS()
        this.scaffolding.getComponent(Transform).scale = this.scaffoldScale
    }
    minimizeUI(){
        this.uiMaximizedContainer.visible = false
        this.uiMinimizedContainer.visible = true
        this.uiMaximized = false
        if (this.selectedEntityIndex >=0 && this.numEntities >0) {
            engine.removeEntity(this.selectionPointer)
        }
        this.scaffolding.getComponent(Transform).scale = Vector3.Zero()
    }
    showUI() {
        this.canvas.visible = true
        this.canvas.isPointerBlocker = true
    }
    hideUI(){
        this.canvas.visible = false
        this.canvas.isPointerBlocker = false
    }

    updateSelectionPointerPOS(transform:TransformConstructorArgs){
        let selectedEntityTransform = transform.position!.clone()
        this.selectionPointer.getComponent(Transform).position = new Vector3(selectedEntityTransform.x, selectedEntityTransform.y + this.selectionPointerElevation, selectedEntityTransform.z)
    }
    selectEntity(selectedEntityIndex:number){
        this.selectedEntityIndex = selectedEntityIndex
        if (this.entities[selectedEntityIndex].entity == null){
            return
        }
        this.displayName.value = this.entities[this.selectedEntityIndex].entity.name
        this.updateSelectionPointerPOS(this.entities[selectedEntityIndex].entity.getComponent(Transform))
    }

    selectPrevious(){
        if (this.selectedEntityIndex>0)
            this.selectEntity(this.selectedEntityIndex-1)
            this.updateDisplayPRS()
    }
    selectNext(){
        if (this.selectedEntityIndex<this.numEntities-1)
            this.selectEntity(this.selectedEntityIndex+1)
            this.updateDisplayPRS()
    }
    discardSelected(){
        log("Discard Selected Entity isn't implemented at this time.")
        // TODO implement
        // be sure to leave the selection on the previous item
        // don't discard any bExisting ones
    }

    toggleCameraOptions(){
        this.movingSystem.addCameraPosition(new Vector3(8,8,8))
        log(this.movingSystem.positions)
        this.scaffolding.addComponent(new Moving("","fixed",0))
    }

    toggleColliders(back:boolean){
        if(584 == this.toggleLift.sourceLeft) {
            this.toggleLift.sourceLeft = 503
            this.scaffloor.getComponent(Material).albedoColor = new Color4(.97,.27,.34)
            this.backWall.getComponent(Transform).scale = this.scaffoldScale
            this.backWall.getComponent(Transform).position = new Vector3(-.6,1.5,0)

            this.frontWall.getComponent(Transform).scale = this.scaffoldScale
            this.frontWall.getComponent(Transform).position = new Vector3(.6,1.5,0)

            this.leftWall.getComponent(Transform).scale = this.scaffoldScale
            this.leftWall.getComponent(Transform).position = new Vector3(0,1.5,.6)

            this.rightWall.getComponent(Transform).scale = this.scaffoldScale
            this.rightWall.getComponent(Transform).position = new Vector3(0,1.5,-.6)
        
        }
        else {
            this.toggleLift.sourceLeft = 584
            this.backWall.getComponent(Transform).scale = Vector3.Zero()
            this.frontWall.getComponent(Transform).scale = Vector3.Zero()
            this.leftWall.getComponent(Transform).scale = Vector3.Zero()
            this.rightWall.getComponent(Transform).scale = Vector3.Zero()

            this.rightWall.getComponent(Transform).position = new Vector3(0,-41.5,-.6)
            this.backWall.getComponent(Transform).position = new Vector3(0,-4.5,-.6)
            this.frontWall.getComponent(Transform).position = new Vector3(0,-4.5,-.6)
            this.leftWall.getComponent(Transform).position = new Vector3(0,-4.5,-.6)

            this.scaffloor.getComponent(Material).albedoColor = Color4.White()
        }
        if(back){
            this.scaffolding.getComponent(Transform).position = new Vector3(1,.3,1)
        }
    }

    moveScaffold(key:string){
        let transform = this.scaffolding.getComponent(Transform)
        switch (this.mode){
            case this.modePOSITION:
                let position = transform.position
                switch (key) {
                    case "a":
                        this.scaffolding.hasComponent(Moving) ? this.scaffolding.removeComponent(Moving) : this.scaffolding.addComponent(new Moving("left", "free"))
                        break
                    case "s":
                        this.scaffolding.hasComponent(Moving) ? this.scaffolding.removeComponent(Moving) : this.scaffolding.addComponent(new Moving("down", "free"))
                        break
                    case "d":
                        this.scaffolding.hasComponent(Moving) ? this.scaffolding.removeComponent(Moving) : this.scaffolding.addComponent(new Moving("right", "free"))
                        break
                    case "q":
                        this.scaffolding.hasComponent(Moving) ? this.scaffolding.removeComponent(Moving) : this.scaffolding.addComponent(new Moving("back", "free"))
                            break
                    case "w":
                        this.scaffolding.hasComponent(Moving) ? this.scaffolding.removeComponent(Moving) : this.scaffolding.addComponent(new Moving("up", "free"))
                        
                        break
                    case "e":
                        this.scaffolding.hasComponent(Moving) ? this.scaffolding.removeComponent(Moving) : this.scaffolding.addComponent(new Moving("forward", "free"))
                        break
                    default:
                        break
                }
                break
            default:
                break
        }
    }

    adjustTransform(key:string){
        this.unsavedContainer.visible = true
        let transform = this.entities[this.selectedEntityIndex].entity.getComponent(Transform)
        switch (this.mode){
            case this.modePOSITION:
                let position = transform.position
                switch (key) {
                    case "a":
                        position.x -= this.snapPosScale
                        break
                    case "s":
                        position.y -= this.snapPosScale
                        break
                    case "d":
                        position.x += this.snapPosScale
                        break
                    case "q":
                            position.z -= this.snapPosScale
                            break
                    case "w":
                        position.y += this.snapPosScale
                        break
                    case "e":
                        position.z += this.snapPosScale
                        break
                    default:
                        break
                }
                this.updateSelectionPointerPOS(transform)
                break
            case this.modeROTATION:

                switch (key) {
                    case "a":
                        transform.rotate(Vector3.Left(), -this.snapRot)
                        break
                    case "s":
                        transform.rotate(Vector3.Up(), this.snapRot)
                        break
                    case "d":
                        transform.rotate(Vector3.Left(), this.snapRot)
                        break
                    case "q":
                        transform.rotate(Vector3.Forward(), -this.snapRot)
                        break
                    case "w":
                        transform.rotate(Vector3.Up(), -this.snapRot)
                        break
                    case "e":
                        transform.rotate(Vector3.Forward(), this.snapRot)
                        break
                    default:
                        break
        
                }
                break
            case this.modeSCALE:
                let scale = transform.scale
                switch (key) {
                    case "a":
                        scale.x -= this.snapPosScale
                        break
                    case "s":
                        scale.y -= this.snapPosScale
                        break
                    case "d":
                        scale.x += this.snapPosScale
                        break
                    case "q":
                        scale.z -= this.snapPosScale
                        break
                    case "w":
                        scale.y += this.snapPosScale
                        break
                    case "e":
                        scale.z += this.snapPosScale
                        break
                    default:
                        break
                }
                break
            default:
                break
        }
        this.updateDisplayPRS()
    }

    async attachToEntity(entity:Entity, preexisting:boolean = true){
        if (entity == null){
            log("BuilderHUD attachToEntity called with a null entity")
        }
        else {
            if(hud.isSetup){
                this.entities[this.numEntities] = {entity: entity, transform: entity.getComponent(Transform), preexisting: preexisting}
                if (preexisting) {
                    if (this.selectedEntityIndex = -1) {
                        this.selectEntity(0) // first preexisting entity will be selected, until we start adding new entities, or the user selects other entities
                    }
                }
                else {
                    // if new entities are added they should be selected
                    this.selectEntity(this.numEntities)
                }
                this.numEntities ++
            }
            else{

            }

        }
    }
    newEntity(){
        // set the new object to be at the camera's location but at Y=0
        let camera = Camera.instance
        //log ("Camera pos =", camera.position, " rotation =", camera.rotation.eulerAngles)  
        // set the new object's rotation in Y to be same as camera's
        let camRotY:number = camera.rotation.eulerAngles.y
        // DCL requires 180 rotation from the coordinate system of Blender
        if (camRotY >= 180)
            camRotY-=180
        else
            camRotY+=180  
        
        let pX:number = 0
        let pY:number = 0
        let pZ:number = 0
        let pRX:number = 0
        let pRY:number = 0
        let pRZ:number = 0
        let pSX:number = 1
        let pSY:number = 1
        let pSZ:number = 1

        if (this.defaultParent != null) {
            let pTransform = this.defaultParent.getComponent(Transform)
            pX = pTransform.position.x
            pY = pTransform.position.y
            pZ = pTransform.position.z
            pRX = pTransform.rotation.eulerAngles.x
            pRY = pTransform.rotation.eulerAngles.y
            pRZ = pTransform.rotation.eulerAngles.z
            pSX = pTransform.scale.x
            pSY = pTransform.scale.y
            pSZ = pTransform.scale.z
        }

        //let tscale:number = Math.sqrt(pSX^2 + pSY^2)

        let t = new Transform({
//            position:new Vector3(camera.position.x-(pSX+1)*pX, 0-(pSY+1)*pY, camera.position.z-(pSZ+1)*pZ),
            //TODO must remove the parent rotation from the postions, as well as the scale.
            position:new Vector3((camera.position.x-pX)/pSX, (0-pY)/pSY, (camera.position.z-pZ)/pSZ),
            rotation: Quaternion.Euler(0, 0, 0), 
            //rotation: Quaternion.Euler(0, 0, 0), 
            //scale:new Vector3(this.newEntityScale, this.newEntityScale, this.newEntityScale)
            scale:new Vector3(this.newEntityScale/pSX, this.newEntityScale/pSY, this.newEntityScale/pSZ)
            //scale:new Vector3(this.newEntityScale/tscale, this.newEntityScale/tscale, this.newEntityScale/tscale)
        })
        // adjust Widget from Blender coordinates to DCL coordinates
       // t.rotate(Vector3.Up(), 180) // not needed to get the model facing "north" when the cam rot is applied

        // adjust Widet's rotation in Y for the Camera rotation around y, but not the other rotations
        t.rotate(Vector3.Up(),-camRotY)
        
        // adjust Widget for the defaultParent's rotation
        //t.rotate(Vector3.Up(),pRY) // CF TODO review how to compensate for parent's rotation

        let e = new Entity()
        e.name="Entity"+this.numEntities
        e.addComponent(t)

        if (this.newEntityShape==null){
            //load the placement widget the first time it is needed
            try {
                this.newEntityShape = new GLTFShape("models/xyz/xyzLeftHand.glb")
            }
            catch (e){
                // user doesn't have the pointer mesh in the above path, so use a green box
                this.newEntityShape = new BoxShape()
                let mtl = new Material()
                mtl.albedoColor = Color3.Green()
                //e.addComponent(mtl)
            }
        }
        e.addComponent(this.newEntityShape)
        if (this.defaultParent != null) {
            e.setParent(this.defaultParent)
        }
        engine.addEntity(e)
        this.attachToEntity(e, false)
    }
    round(n:number):number{
        return Math.floor((n+0.00049)*1000)/1000
    }
    dump(){
        this.unsavedContainer.visible = false
        // Write the pseudo spawnEntity code for all the entities to the console
        log("--------------- BuilderHUD entities -------------")
        for (let i in this.entities){
            let name = ((this.entities[i].entity.name == null)?"Existing":""+this.entities[i].entity.name)
            let t = this.entities[i].transform
            let p = t.position
            let r = t.rotation.eulerAngles
            let s = t.scale
            let pstring:string = "position: new Vector3("+this.round(p.x)+","+this.round(p.y)+","+this.round(p.z)+"), rotation: Quaternion.Euler("+this.round(r.x)+","+this.round(r.y)+","+this.round(r.z)+"), scale: new Vector3("+this.round(s.x)+","+this.round(s.y)+","+this.round(s.z) + ")"
            log(""+name+" {"+pstring+"}")
        }
        log("-------------------------------------------------")
    }
    destroy(){
        this.dump()
        //@CF TODO rework to preserve the preexisting entities in the list.
        for (let i in this.entities){
            if (!this.entities[i].preexisting){
                this.entities[i].entity.setParent(null)
                engine.removeEntity(this.entities[i].entity)
                //this.entities[i].entity=null // should probaby be last reference to it, freeing its memory
            }
        }
        this.entities = [] 
        this.numEntities=0
        this.refreshDisplay()
    }
    refreshDisplay (){
        //TODO update the list of objects etc. in HUD
    }
}

export class hudDelay {
    timer: number = 4
    hud:BuilderHUD
    entities:Entity[] = []

    constructor(hud:BuilderHUD){
        this.hud = hud
    }

    pendingEntity(entity:Entity){
        this.entities.push(entity)
    }

    update(dt: number) {
        if (this.timer > 0) {
          this.timer -= dt
        } else {
          this.timer = 4
          for(var i = 0; i < this.entities.length; i++){
              log("here")
              this.hud.attachToEntity(this.entities[i], true)
          }
          this.entities = []
        }
    }
}


export var hud = new BuilderHUD()
hud.pendingEntityAdd = new hudDelay(hud)
engine.addSystem(hud.pendingEntityAdd)

export class ClickAnimationSystem {

    uiIMage:UIImage
    timer = .1

    constructor(image:UIImage){
        this.uiIMage = image
    }
  update(dt: number) {
    if (this.timer > 0) {
        this.uiIMage.opacity -= .3
        this.timer -= dt
    } else {
        this.timer = .1
        this.uiIMage.opacity = 1
        engine.removeSystem(this)
    }
  }
}

