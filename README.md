﻿# svg_line_graph
Генерация простого линейного графика в формате SVG

## Требования
Браузер с поддержкой ECMAScript 2018 и SVG 1.1

Для минификации и тестирования - node.js 18+ (опционально)

## Использование

Скрипт создаёт глобальную функцию svg_line_graph.

Функция формирует SVG в виде строки.
Строку можно вставить в HTML-документ:
```
<div id="graph-container" style="width:800px; height:400px;"></div>
<script src="../svg_line_graph.js"><script>
<script>
document.getElementById('graph-container').innerHTML = svg_line_graph({
    series: [{name:'foo', color:'#f00', values:[1,2,4,5,3,0]}],
    xlabels: [0,1,2,3,5,6,7] 
  });
</script>
```
или
```
<div id="graph-container" style="width:800px; height:400px;"></div>
<script type="module">
import {svg_line_graph} from 'path/svg_line_graph.mod.js';
document.getElementById('graph-container').innerHTML = svg_line_graph({
    series: [{name:'foo', color:'#f00', values:[1,2,4,5,3,0]}],
    xlabels: [0,1,2,3,5,6] 
  });
</script>
```

## Параметры

| имя         | | тип             | по умолчанию      | описание
| ------------|-|-----------------|-------------------|--------------------------------------------------------------------------
| **series**  | | Array[{}]       |                   | данные и метаданные рядов (линий)
| | values    |   [Number]        |                   | значения по оси Y, значения null|undefined не рисуются
| | color     |   String          | набор из 9 цветов | цвет линии: имя / #hex / rgb() / rgba()
| | name      |   String          | ""                | подпись ряда в легенде
| id          | | String          | 'svg_line_graph'  | идентификатор генерируемого элемента SVG
| width       | | Number          | 800               | ширина графика с отступами, px
| height      | | Number          | 400               | высота графика с отступами, px
| margins     | | Array[Number]   | [40,10,20,50]     | отступы [сверху, справа, снизу (подписи оси X), слева (подписи оси Y)]
| legend      | | Array[Number]   | [50,0,100,20]     | положение и размер легенды [x,y,line-width,line-height]
| legend_vertical | | Bool        | false             | расположение элементов легенды
| ymin        | | Number          | min(values)       | минимальное отображаемое значение по оси Y 
| ymax        | | Number          | max(values)       | максимальное отображаемое значение по оси Y
| yunit       | | String          | ""                | единица измерения на оси Y, общая для всех серий
| xlabels     | | Array[String]   | []                | подписи оси X включая начало и конец диапазона, задают вертикальную сетку
| marker      | | Number          | 0                 | радиус маркера для точки на графике
| custom      | | String          | ""                | произвольный текст вставляемый в начало SVG: элементы SVG, скрипты или стили
| hint        | | Object{String:*}| undefined         | подсказка для точки графика, см. ниже

Параметры width и height задают относительные размеры графика.

Итоговая ширина/высота определяются стилем HTML-элемента, куда будет вставлен SVG.

Параметры отображения всех элементов графика задаются встроенными стилями и могут быть переопределены через CSS.

## Подсказка для точки графика

### { "static": Function }
Для каждой точки вызывается функция с двумя параметрами (индекс серии, индекс значения).
Результат вычисления будет вставлен в SVG и отображён при наведении курсора.

### { "dynamic": function-name }
Глобальная функция будет вызвана при наведении курсора на точку графика.

### { "external": "" }
Вызывающая сторона должна сама обработать события mouseenter на объектах ``.hint circle``

Обработчик может получить индекс серии и индекс значения из атрибутов event.target.dataset.si и .vi

## Структура генерируемого SVG

Для стилизации

``Тэг.класс``
  * svg.graph
    * path.grid - сетка
    * g.xaxis
      * path - ось X
      * text - подписи оси X
    * g.yaxis
      * path - ось Y (0)
      * text - подписи оси Y
    * g.line.series-#
      * path - линия
      * g.marker
        * circle - маркер
      * g.hint
        * circle - область наведения курсора для подсказки
    * g.legend - обозначение рядов
      * rect - граница
      * g.series-#
        * circle
        * text - имя ряда