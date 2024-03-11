import { _decorator, CCFloat, Component, EventTouch, input, Input, instantiate, Node, Sprite, tween, UITransform, v3, Vec2, Vec3, view, Widget } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BulletFollow2D')
export class BulletFollow2D extends Component {
    @property(Node)
    target: Node;
    @property(Node)
    bulletPfb: Node;
    @property(Node)
    bumpPfb: Node;
    @property(CCFloat)
    internal: number = 5;
    @property(CCFloat)
    speed: number = 100;

    touchDown: boolean = false;
    bullets: Node[] = [];
    tick: number = this.internal;

    start() {
        input.on(Input.EventType.TOUCH_START, (event: EventTouch) => {
            this.onTouch(event);
            this.touchDown = true;
        }, this);
        input.on(Input.EventType.TOUCH_MOVE, (event: EventTouch) => {
            if (this.touchDown)
                this.onTouch(event);
        }, this);
        input.on(Input.EventType.TOUCH_END, (event: EventTouch) => {
            this.touchDown = false;
        }, this);
    }

    onTouch(event: EventTouch) {
        var size = view.getVisibleSize();
        this.target.setPosition(event.getUILocation().x - size.width / 2, event.getUILocation().y - size.height / 2, 0);
    }

    update(deltaTime: number) {
        this.tick += deltaTime;
        if (this.tick >= this.internal) {
            this.tick -= this.internal;
            var bullet = instantiate(this.bulletPfb);
            bullet.getComponent(Widget).destroy();
            bullet.scale = this.bulletPfb.scale.clone().divide3f(2, 2, 2);
            bullet.parent = this.bulletPfb.parent;
            tween(bullet).by(1, { position: v3(0, this.bulletPfb.getComponent(UITransform).width / 2 * this.bulletPfb.scale.x + bullet.getComponent(UITransform).width / 2 * bullet.scale.x, 0) })
                .call(() => {
                    this.bullets.push(bullet);
                }).start();
        }
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let bullet = this.bullets[i];
            let position = bullet.position;
            let targetPos = this.target.getPosition();
            let dir = targetPos.subtract(position).normalize();
            bullet.angle = Math.atan2(-dir.y, -dir.x) * 180 / Math.PI;
            bullet.setPosition(position.x + dir.x * this.speed * deltaTime, position.y + dir.y * this.speed * deltaTime, position.z);
            if (Vec3.distance(bullet.position, this.target.position) < 10) {
                this.bullets.splice(i, 1);
                bullet.destroy();

                let bump = instantiate(this.bumpPfb);
                bump.parent = this.bumpPfb.parent;
                bump.position = this.target.position;
                bump.scale = Vec3.ZERO;
                bump.active = true;
                tween(bump)
                    .to(0.3, { scale: v3(0.2, 0.2, 0.2) })
                    .delay(0.1)
                    .call(() => { bump.destroy(); })
                    .start();
            }
        }
    }
}