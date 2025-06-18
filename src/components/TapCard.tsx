import {
  press,
  DOMKeyframesDefinition,
  AnimationOptions,
  animate,
} from "motion";
import {
  ParentComponent,
  ComponentProps,
  JSXElement,
  Accessor,
  createSignal,
  createEffect,
  onCleanup,
  mergeProps,
} from "solid-js";
import { cn } from "../libs/cn";

const DEFAULT_ANIMS: {
  anim: DOMKeyframesDefinition;
  opt: AnimationOptions;
}[] = [
  {
    anim: { scale: 1.5, rotateY: 0, zIndex: 20 },
    opt: { type: "spring", stiffness: 500 },
  },
  {
    anim: { rotateY: 180 },
    opt: { type: "spring", duration: 1, stiffness: 100 },
  },
  {
    anim: { scale: 1, rotateY: 0, zIndex: 0 },
    opt: { type: "spring", stiffness: 200 },
  },
];

export const TapCard: ParentComponent<
  ComponentProps<"div"> & {
    back: JSXElement;
    canBeTapped: Accessor<boolean>;
    toggleLocked: () => void;
    width: Accessor<number>;
    selected: Accessor<number>;
    anims?: typeof DEFAULT_ANIMS;
  }
> = (props) => {
  let cardRef: HTMLDivElement | undefined;
  const [tapCount, setTapCount] = createSignal<number>(0);
  const merged = mergeProps({ anims: DEFAULT_ANIMS }, props);

  createEffect(() => {
    const cancelPress = press(cardRef, (element) => {
      const pressPos = props.selected();
      // On press end
      return () => {
        if (!props.canBeTapped() || props.selected() != pressPos) return;

        const currentAnim = merged.anims[tapCount()];
        animate(element, currentAnim.anim, currentAnim.opt);
        setTapCount((prev) => {
          if (prev == 0 || prev == merged.anims.length - 1)
            props.toggleLocked();
          const next = prev === merged.anims.length - 1 ? 0 : prev + 1;
          return next;
        });
      };
    });

    onCleanup(() => {
      cancelPress();
    });
  });

  return (
    <div
      ref={cardRef}
      class={cn(
        "aspect-square rounded-lg bg-slate-700 shadow-xl",
        "flex cursor-pointer snap-center items-center justify-center",
        "relative perspective-distant transform-3d",
      )}
      style={{
        width: `${props.width()}px`,
      }}
    >
      <div class="absolute backface-hidden">{props.children}</div>
      <div class="absolute rotate-y-180 backface-hidden">{props.back}</div>
    </div>
  );
};

export default TapCard;
