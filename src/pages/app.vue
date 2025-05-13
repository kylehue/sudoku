<template>
   <div
      class="h-screen w-screen flex flex-col items-center justify-center"
      @click.self="hideNumberPad"
   >
      <div class="flex flex-col justify-center">
         <div class="flex py-4 gap-2">
            <button @click="regenerateTable()" :disabled="isVisualizing">
               Generate random
            </button>
            <button
               @click="table = table.map((v) => v.map(() => NaN))"
               :disabled="isVisualizing"
            >
               Clear
            </button>
            <button @click="solve()" :disabled="isVisualizing">Solve</button>
            <button v-if="!isVisualizing" @click="solveSudokuVisualizeAsync">
               Solve (Visualize)
            </button>
            <div v-else class="flex flex-col">
               <label for="visualizationDelay" class="text-xs">
                  Delay ({{ visualizationDelay }} ms):
               </label>
               <input
                  id="visualizationDelay"
                  type="range"
                  min="1"
                  max="1000"
                  v-model="visualizationDelay"
               />
            </div>
         </div>
         <div
            class="sudoku-table flex flex-col aspect-square"
            :class="{
               'bg-green-300': isSolved,
            }"
         >
            <div class="flex flex-1" v-for="(row, i) in table" :key="i">
               <button
                  class="aspect-square text-lg text-center flex-1 min-h-12 min-w-12"
                  v-for="(_, j) in row"
                  :key="j"
                  :value="table[i][j]"
                  @click="onCellClick($event, i, j)"
                  :class="{
                     'opacity-25':
                        showPad &&
                        !(activeCell[0] === i && activeCell[1] === j),
                     'scale-105': activeCell[0] === i && activeCell[1] === j,
                     'z-10': activeCell[0] === i && activeCell[1] === j,
                     'bg-red-300': !validityMatrix[i][j],
                     'font-bold': initialTable[i][j] === table[i][j],
                     'text-xl': initialTable[i][j] === table[i][j],
                  }"
                  :disabled="isVisualizing"
                  @keydown.delete="
                     () => {
                        table[i][j] = NaN;
                        hideNumberPad();
                     }
                  "
               >
                  {{ isNaN(table[i][j]) ? "" : table[i][j] }}
               </button>
            </div>
         </div>
      </div>
   </div>

   <Teleport to="body">
      <div v-if="showPad" ref="padRef" class="number-pad">
         <button
            v-for="n in sizeRoot ** 2"
            :key="n"
            class="aspect-square size-12 text-lg text-center"
            @click="handleNumberPadClick(n)"
            :disabled="isVisualizing"
         >
            {{ n }}
         </button>
      </div>
      <button class="flex absolute bottom-2 right-2" @click="isDark = !isDark">
         {{ !isDark ? "light" : "dark" }}
      </button>
   </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, computed, watch } from "vue";
import { createPopper, type Instance } from "@popperjs/core";
import {
   generateRandomUnsolvedSudokuTable,
   generateValidityMatrix,
   isValidSudoku,
   solveSudoku,
   solveSudokuVisualize,
} from "../lib/sudoku";

const isDark = ref(false);
const sizeRoot = 3;
const table = ref(generateRandomUnsolvedSudokuTable(sizeRoot));
const initialTable = ref(table.value);
const validityMatrix = computed(() => generateValidityMatrix(table.value));
const isSolved = computed(() => isValidSudoku(table.value));
const visualizationDelay = ref(100);

const currentButton = ref<HTMLElement | null>(null);
const padRef = ref<HTMLElement | null>(null);
const popperInstance = ref<Instance | null>(null);
const showPad = ref(false);
const activeCell = ref([-1, -1]);

const isVisualizing = ref(false);
async function solveSudokuVisualizeAsync() {
   if (isValidSudoku(table.value)) return;
   initialTable.value = table.value.map((v) => [...v]);
   isVisualizing.value = true;
   await solveSudokuVisualize(table.value, async (currentTable) => {
      table.value = currentTable.map((row) => [...row]);
   });
   isVisualizing.value = false;
}

function solve() {
   if (isValidSudoku(table.value)) return;
   initialTable.value = table.value.map((v) => [...v]);
   table.value = solveSudoku(table.value)[0] ?? initialTable.value;
}

function regenerateTable() {
   table.value = generateRandomUnsolvedSudokuTable(sizeRoot);
   initialTable.value = table.value.map((v) => [...v]);
}

function onCellClick(event: Event, i: number, j: number) {
   if (
      showPad.value &&
      i === activeCell.value[0] &&
      j === activeCell.value[1]
   ) {
      hideNumberPad();
      return;
   }

   currentButton.value = event.currentTarget as HTMLElement;
   activeCell.value = [i, j];
   showPad.value = true;

   nextTick(() => {
      if (popperInstance.value) {
         popperInstance.value.destroy();
      }
      if (currentButton.value && padRef.value) {
         popperInstance.value = createPopper(
            currentButton.value,
            padRef.value,
            {
               placement: "bottom",
               modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
            }
         );
      }
   });
}

function hideNumberPad() {
   showPad.value = false;
   if (popperInstance.value) {
      popperInstance.value.destroy();
      popperInstance.value = null;
      activeCell.value = [-1, -1];
   }
}

function handleNumberPadClick(number: number) {
   const [i, j] = activeCell.value;
   table.value[i][j] = number;
   hideNumberPad();
}

watch(isDark, (isDark) => {
   document.documentElement.classList.toggle("dark", isDark);
});

watch(visualizationDelay, (delay) => {
   (window as any).VISUALIZATION_DELAY = delay;
});
</script>

<style scoped>
.number-pad {
   display: grid;
   grid-template-columns: repeat(v-bind("sizeRoot"), minmax(0, 1fr));
}
</style>
