import type { Component } from "solid-js";
import Swiper from "./components/Swiper";

const App: Component = () => {
  return (
    <div class="flex h-dvh touch-none flex-col items-center justify-center gap-8 bg-slate-400">
      <h1 class="text-4xl">
        <a
          href="https://github.com/HarryYu02/solid-swiper"
          class="underline"
          aria-label="github repo of this solid swiper"
        >
          Solid Swiper
        </a>
      </h1>
      <Swiper />
    </div>
  );
};

export default App;
