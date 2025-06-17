import {
  animate,
  AnimationOptions,
  DOMKeyframesDefinition,
  press,
} from "motion";
import { createEffect, JSXElement, ParentComponent, Setter } from "solid-js";
import { cn } from "../libs/cn";

const Card: ParentComponent<{
  back: JSXElement;
  canBeTapped: boolean;
  setTapped: Setter<number>;
  tapped: number;
  currentPos: number;
}> = (props) => {
  let cardRef: HTMLDivElement | undefined;

  createEffect(() => {
    press(cardRef, (element) => {
      const pressPos = props.currentPos;
      // On press end
      return () => {
        let anim: DOMKeyframesDefinition;
        let opt: AnimationOptions;

        if (!props.canBeTapped || props.currentPos != pressPos) return;

        switch (props.tapped) {
          case 0:
            anim = { scale: 1.5, rotateY: 0, zIndex: 20 };
            opt = { type: "spring", stiffness: 500 };
            break;
          case 1:
            anim = { rotateY: 180 };
            opt = { type: "spring", duration: 1, stiffness: 100 };
            break;
          case 2:
            anim = { scale: 1, rotateY: 0, zIndex: 0 };
            opt = { type: "spring", stiffness: 200 };
            break;
          default:
            break;
        }

        const a = animate(element, anim, opt);
        props.setTapped((tapped) => {
          if (tapped == 2) return 0;
          return tapped + 1;
        });
      };
    });
  });

  return (
    <div
      ref={cardRef}
      class={cn(
        "card aspect-square h-48 w-48 rounded-lg bg-slate-700 shadow-xl",
        "flex cursor-pointer snap-center items-center justify-center",
        "relative perspective-distant transform-3d",
      )}
    >
      <div class="absolute backface-hidden">{props.children}</div>
      <div class="absolute rotate-y-180 backface-hidden">{props.back}</div>
    </div>
  );
};

export default Card;
