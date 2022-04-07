'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * 限制可输入字节数(1个中文2个字节)
 *
 * 用法1：
 * <el-input v-model="test" v-maxlength:test="10"></el-input>
 *
 * 用法2：
 * <li v-for="(item, i) in test">
 *  <el-input v-model="item.a" v-maxlength="{limit:10, field:`test.${i}.a`}"></el-input>
 * </li>
 *
 * 用法3：
 * <el-input v-model="test" v-maxlength="{limit:10, field:'test', type:'int'}"></el-input>
 *
 * 指令参数：
 * @param {Number} limit 限制的字节数
 * @param {String} field 需要改变的组件data中的字段（具体访问路径）
 * @param {String} type 目前只支持'int'，只允许输入整数数字
 *
 * 注意：尽量使用原生input元素。
 * 使用element-ui的组件el-input时，输入框失去焦点时原先被限制住的内容会回显输入框
 * 尽管分别在输入框输入内容时、失去焦点时、组件data改变时进行了3次限制，但总有不触发这三个钩子的时候（比如输入框失去焦点后点击不会更新组件data的提交按钮）
 */

// 返回字符串str的长度，其中中文占2个长度单位，英文等字符占1个长度单位
var length = function length(str) {
    /* eslint-disable */
    var r = /[^\x00-\xff]/g;
    return str.replace(r, 'mm').length;
};

// 返回指定绑定的input/textarea元素
var getInputTarget = function getInputTarget(el) {
    var inputTarget = el;
    // 如果指令不是绑定在input/textarea元素上，则取其第一个input/textarea元素子节点作为目标输入框
    // 换言之，v-maxlength必须绑定在input/textarea元素上或者子节点中有input/textarea元素的元素上
    var bindedTagNames = ['INPUT', 'TEXTAREA'];
    if (!bindedTagNames.includes(el.tagName)) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = el.childNodes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var element = _step.value;

                if (bindedTagNames.includes(element.tagName)) {
                    inputTarget = element;
                    break;
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }
    if (!bindedTagNames.includes(inputTarget.tagName)) {
        throw new Error('指令绑定位置错误！');
    }
    return inputTarget;
};

var limitHandler = function limitHandler(inputTarget, field, limit, type, vnode, intLimitVal) {
    var val = intLimitVal || inputTarget.value;
    var byte = length(val);
    var strLength = val.length;
    var chineseNum = byte - strLength;
    var notChineseNum = strLength - chineseNum;

    if (byte > limit) {
        // 截断的长度
        // 因为只有连续输入字节超出limit的情况下才需要截断（其他情况输入已经被maxlength限制住了），所以计算规则：
        // 截断的长度 = 一个一个输入的非中文字符串长度 + 允许输入的中文字符串长度
        var subLength = notChineseNum + Math.floor((limit - notChineseNum) / 2);
        var newVal = val.substring(0, subLength);
        // inputTarget.maxLength = subLength

        // 如果用户在两个非中文之间输入中文，subLength会比预计的多1个(如‘11’ -> ‘1我我1’,最后会变成 -> ‘1我我’)
        // 所以需要再校准一遍
        if (length(newVal) > limit) {
            newVal = newVal.substring(0, subLength - 1);
            // inputTarget.maxLength = subLength -1
        }

        // 修改目标字段
        var theField = vnode.context;
        var fields = field.split('.');
        var fieldsLength = fields.length;
        var lastField = fields[fieldsLength - 1];
        for (var i = 0; i < fieldsLength - 1; i++) {
            theField = theField[fields[i]];
        }

        theField[lastField] = newVal;
        setTimeout(function () {
            inputTarget.value = newVal;
        }, 0);
    } else {
        inputTarget.maxLength = limit - chineseNum;
        // if (type === 'int') {
        //   return
        // }
        // setTimeout(() => {
        //   inputTarget.value = val
        // }, 0)
    }
};

var intHandler = function intHandler(inputTarget, vnode, field) {
    var formatVal = /[^\d]/;
    var val = inputTarget.value;

    // 修改目标字段
    var theField = vnode.context;
    var fields = field.split('.');
    var fieldsLength = fields.length;
    var lastField = fields[fieldsLength - 1];
    for (var i = 0; i < fieldsLength - 1; i++) {
        theField = theField[fields[i]];
    }

    if (formatVal.test(val)) {
        var reg = new RegExp(formatVal, 'g');
        var newVal = val.replace(reg, '');

        // // 修改目标字段
        // let theField = vnode.context
        // let fields = field.split('.')
        // let fieldsLength = fields.length
        // let lastField = fields[fieldsLength - 1]
        // for (let i = 0; i < fieldsLength - 1; i++) {
        //     theField = theField[fields[i]]
        // }

        theField[lastField] = newVal;

        setTimeout(function () {
            inputTarget.value = newVal;
        }, 0);
    } else {
        theField[lastField] = val;
    }
};

// let toLimit = (inputTarget, field, limit, type, vnode) => {
//   limitHandler(inputTarget, field, limit, type, vnode)
//   if (type === 'int') {
//     intHandler(inputTarget, vnode, field)
//   }
// }

var MaxlengthPlugin = {};

MaxlengthPlugin.install = function (Vue, options) {
    Vue.directive('maxlength', {
        bind: function bind(el, binding, vnode) {
            var inputTarget = getInputTarget(el);
            var arg = binding.arg;

            var _ref = arg ? { field: arg, limit: binding.value, type: binding.value } : binding.value,
                field = _ref.field,
                limit = _ref.limit,
                type = _ref.type;

            inputTarget.handler = function () {
                intHandler(inputTarget, vnode, field);
            };
            inputTarget.blurHandler = function () {
                limitHandler(inputTarget, field, limit, type, vnode);
            };

            if (type === 'int') {
                inputTarget.addEventListener('input', inputTarget.handler);
            }
            inputTarget.addEventListener('blur', inputTarget.blurHandler);
        },
        update: function update(el, binding, vnode) {
            var inputTarget = getInputTarget(el);

            var arg = binding.arg;

            var _ref2 = arg ? { field: arg, limit: binding.value, type: binding.value } : binding.value,
                field = _ref2.field,
                limit = _ref2.limit,
                type = _ref2.type;

            var val = inputTarget.value;

            // 限制只能输入整数数字
            if (type === 'int') {
                var newVal = val.replace(/[^\d]/g, '');
                val = newVal;
            }
            limitHandler(inputTarget, field, limit, type, vnode, val);
            if (type === 'int') {
                // 兼容el-input失焦后被限制的字符又显示在input dom value上的问题
                // dom失焦会触发指令update钩子
                setTimeout(function () {
                    inputTarget.value = val;
                }, 0);
            }
        },
        unbind: function unbind(el) {
            var inputTarget = getInputTarget(el);
            inputTarget.removeEventListener('input', el.handler);
            inputTarget.removeEventListener('blur', el.blurHandler);
        }
    });
};

exports.default = MaxlengthPlugin;
