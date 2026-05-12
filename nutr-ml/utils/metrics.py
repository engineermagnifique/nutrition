import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, mean_absolute_error, r2_score


def classification_metrics(y_true, y_pred, class_names: list = None) -> dict:
    report = classification_report(y_true, y_pred, target_names=class_names, output_dict=True)
    cm = confusion_matrix(y_true, y_pred)
    return {"report": report, "confusion_matrix": cm.tolist()}


def regression_metrics(y_true, y_pred) -> dict:
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    return {"mae": mae, "rmse": rmse, "r2": r2}
