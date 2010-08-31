package com.qcadoo.mes.core.data.internal.validators;

import java.math.BigDecimal;
import java.util.Date;

import com.qcadoo.mes.core.data.definition.FieldDefinition;
import com.qcadoo.mes.core.data.validation.FieldValidator;
import com.qcadoo.mes.core.data.validation.ValidationResults;

public final class RangeValidator implements FieldValidator {

    private static final String OUT_OF_RANGE_ERROR = "core.validation.error.outOfRange";

    private String errorMessage = OUT_OF_RANGE_ERROR;

    private final Object from;

    private final Object to;

    public RangeValidator(final Object from, final Object to) {
        this.from = from;
        this.to = to;
    }

    @Override
    public boolean validate(final FieldDefinition fieldDefinition, final Object value, final ValidationResults validationResults) {
        if (value == null) {
            return true;
        }

        Class<?> fieldClass = fieldDefinition.getType().getType();

        if (fieldClass.equals(String.class)) {
            return validateStringRange(fieldDefinition, (String) value, validationResults);
        } else if (fieldClass.equals(Integer.class) || fieldClass.equals(BigDecimal.class)) {
            return validateNumberRange(fieldDefinition, (Number) value, validationResults);
        } else if (fieldClass.equals(Date.class)) {
            return validateDateRange(fieldDefinition, (Date) value, validationResults);
        }

        return true;
    }

    private boolean validateDateRange(final FieldDefinition fieldDefinition, final Date value,
            final ValidationResults validationResults) {
        if (from != null && value.before((Date) from)) {
            addError(fieldDefinition, validationResults);
            return false;
        }
        if (to != null && value.after((Date) to)) {
            addError(fieldDefinition, validationResults);
            return false;
        }
        return true;
    }

    private boolean validateNumberRange(final FieldDefinition fieldDefinition, final Number value,
            final ValidationResults validationResults) {
        if (from != null && value.doubleValue() < ((Number) from).doubleValue()) {
            addError(fieldDefinition, validationResults);
            return false;
        }
        if (to != null && value.doubleValue() > ((Number) to).doubleValue()) {
            addError(fieldDefinition, validationResults);
            return false;
        }
        return true;
    }

    private boolean validateStringRange(final FieldDefinition fieldDefinition, final String value,
            final ValidationResults validationResults) {
        if (from != null && value.compareTo((String) from) < 0) {
            addError(fieldDefinition, validationResults);
            return false;
        }
        if (to != null && value.compareTo((String) to) > 0) {
            addError(fieldDefinition, validationResults);
            return false;
        }
        return true;
    }

    private void addError(final FieldDefinition fieldDefinition, final ValidationResults validationResults) {
        validationResults.addError(fieldDefinition, errorMessage, String.valueOf(from), String.valueOf(to));
    }

    @Override
    public FieldValidator customErrorMessage(final String errorMessage) {
        this.errorMessage = errorMessage;
        return this;
    }
}
