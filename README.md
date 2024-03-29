﻿# svg_line_graph
Генерация простого линейного графика в формате SVG

## Требования
Браузер с поддержкой ECMAScript 2018 и SVG 1.1

Для минификации и тестирования - node.js 18+ (опционально)

## Использование

Функция svg_line_graph формирует SVG в виде строки, которую можно вставить в HTML-документ.

либо загрузив глобальную функцию:
``` js
<div id="graph-container" style="width:800px; height:400px;"></div>
<script src="path/svg_line_graph.js"><script>
<script>
document.getElementById('graph-container').innerHTML = svg_line_graph({
    series: [{values:[1,2,4,5,3,0]}],
    xlabels: [0,1,2,3,5,6,7] 
  });
</script>
```
либо загрузив JS-модуль:
``` js
<div id="graph-container" style="width:800px; height:400px;"></div>
<script type="module">
import {svg_line_graph} from 'path/svg_line_graph.mod.js';
document.getElementById('graph-container').innerHTML = svg_line_graph({
    series: [{values:[1,2,4,5,3,0]}],
    xlabels: [0,1,2,3,5,6] 
  });
</script>
```

Сгенерированный SVG содержит JavaScript для:
  - скрытия/показа легенды
  - выделения/скрытия ряда при клике на легенде

## Параметры

| имя         | | тип             | по умолчанию       | описание
| ------------|-|-----------------|--------------------|--------------------------------------------------------------------------
| id          | | String          | 'svg_line_graph'   | идентификатор генерируемого элемента SVG
| width       | | Number          | 800                | относительная ширина графика с отступами
| height      | | Number          | 400                | относительная высота графика с отступами
| ymin        | | Number          | min(values)        | минимальное отображаемое значение по оси Y 
| ymax        | | Number          | max(values)        | максимальное отображаемое значение по оси Y
| yticks      | | Number          | 10                 | максимальное число делений по оси Y
| yunit       | | String          | ""                 | подпись единицы измерения на оси Y, общая для всех серий
| xlabels     | | Array[String/Number] | []            | подписи оси X включая начало и конец диапазона, задают вертикальную сетку
| margins     | | Array[Number]   | [40,10,20,50]      | отступы [сверху - легенда, справа, снизу - подписи оси X, слева - подписи оси Y]
| legend      | | Object{}        | undefined          | положение и размеры легенды, undefined=не отображать
|  | w        |   Number          | 100                | ширина элемента
|  | h        |   Number          | 20                 | высота элемента, неявно определяет все остальные размеры
|  | vertical |   Bool            | false              | вертикальное расположение элементов
|  | grow     |   Bool            | false              | автоматическое увеличение числа строк/столбцов
|  | anchor   |   String          | 'tl'               | приязка к краям: tl|t|tr|l|r|bl|b|br
|  | x        |   Number          | 50                 | смещение по горизонтали
|  | y        |   Number          | 0                  | смещение по вертикали
| marker      | | Number/String   | undefined          | маркер точки: относительный радиус окружности или идентификатор пользовательского маркера определёного в custom defs
| custom      | | String          | ""                 | произвольный текст вставляемый в начало SVG: элементы SVG, скрипты, стили
| hint        | | Object{String:String|Function}| undefined          | подсказка для точки графика, см. ниже
| hint_r      | | Number          | 5% высоты          | радиус круга для появления подсказки
| gaps        | | String          | skip               | режим отрисовки пропущенных значений
| xl_offset   | | Number          | 4                  | смещение подписей оси X по вертикали
| yl_offset   | | Number          | -2                 | смещение подписей оси Y по горизонтали
| **series**  | | Array[Object]   |                    | данные и метаданные рядов (линий)
| | values    |   [Number]        |                    | значения по оси Y
| | name      |   String          | ""                 | подпись ряда в легенде
| | name_long |   String          | ""                 | детальное описание ряда в легенде
| | color     |   String          | набор из 12 цветов | цвет линии: имя / #hex / rgb() / rgba()
| | marker    |   Number/String   | undefined          | переопределяет marker для ряда
| | gaps      |   String          | undefined          | переопределяет gaps для ряда


Параметры width и height задают относительные размеры графика.
Все размеры задаются в данном масштабе.

Итоговая ширина/высота определяются стилем HTML-элемента, куда будет вставлен SVG.

Параметры отображения почти всех элементов графика задаются встроенными стилями и могут быть переопределены через CSS.

Размер маркера зависит от толщины линии, стиль по умолчанию задаёт толщину 3, то есть marker=1 означает радиус 3.

## Параметр 'gaps'
Влияет если в серии данных имеются разрывы (значения null или undefined)
Возможные значения:
  * 'skip'   - точка пропускается (по умолчанию)
  * 'ignore' - рисуется линия от предыдущей точки
  * 'zero'   - для предыдущей и следующей точки рисуется вертикальная линия от нуля (подобие bar chart)

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
    * g.xaxis - ось X
      * path - линия
      * text - подписи
    * g.yaxis - ось Y
      * path - линия
      * text - подписи
    * path.line.series#[.normal|.highlight|.shadow] - линия графика
    * g.hint.series#
      * circle - область наведения курсора для подсказки + псевдокласс :hover
    * g.legend - обозначение рядов
      * rect.legend.background - граница
      * g.legend.series#.item[.normal|.highlight|.shadow]
        * path.legend.series#.marker - образец маркера, круг по умолчанию
        * text.legend.series#.text - имя ряда
    * rect.legend.toggle - кнопка для показа/скрытия легенды    